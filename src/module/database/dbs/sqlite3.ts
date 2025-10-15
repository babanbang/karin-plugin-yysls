import { dir } from '@/dir'
import { existsSync, json, logger, mkdirSync, rmSync } from 'node-karin'
import fs from 'node:fs'
import path from 'node:path'
import { DataTypes, Model, ModelAttributeColumnOptions, Op, Sequelize } from 'sequelize'
import { DatabaseArray, DatabaseClassInstance, DatabaseClassStatic, DatabaseReturn, DatabaseType, Dialect, ModelAttributes } from '../types'
import { DbBase } from './base'

const dialect = Dialect.Sqlite

const sequelize = new Sequelize({
  storage: path.join(dir.DataDir, 'database', 'sqlite3.db'), dialect, logging: false
})

export class Sqlite3<T extends Record<string, any>, D extends DatabaseType> extends DbBase<T, D> implements DatabaseClassInstance<T, D> {
  async check (): Promise<boolean> {
    try {
      await sequelize.authenticate()
      return true
    } catch (error) {
      logger.error(error)
      return false
    }
  }

  async init (DataDir: string, modelName: string, modelSchema: ModelAttributes<Model>, type: D): Promise<DatabaseClassInstance<T, D>> {
    this.initBase(DataDir, modelName, modelSchema, type)

    if (this.databaseType === DatabaseType.Db) {
      this.model = sequelize.define(this.modelName, this.modelSchema, {
        timestamps: false, freezeTableName: true
      })
      await this.model.sync()

      const queryInterface = sequelize.getQueryInterface()
      const tableDescription = await queryInterface.describeTable(this.modelName)
      for (const key in this.modelSchema) {
        if (!tableDescription[key]) {
          await queryInterface.addColumn(this.modelName, key, this.modelSchema[key])
          if (typeof this.modelSchema[key] === 'string') continue

          const defaultValue = (this.modelSchema[key] as any).defaultValue
          if (defaultValue !== undefined) {
            await this.model.update({ [key]: defaultValue }, { where: {} })
          }
        }
      }
    }

    return this
  }

  async findByPk (pk: string, create: true): Promise<DatabaseReturn<T>[D]>
  async findByPk (pk: string, create?: false): Promise<DatabaseReturn<T>[D] | undefined>
  async findByPk (pk: string, create: boolean = false): Promise<DatabaseReturn<T>[D] | undefined> {
    if (this.databaseType !== DatabaseType.Db) {
      const path = this.userPath(pk)
      if (!existsSync(path)) {
        if (create) {
          const data = this.schemaToJSON(pk)
          if (this.databaseType === DatabaseType.Dir) {
            mkdirSync(path)
            this.writeDirSync(pk, data)

            return {
              ...data,
              save: this.saveDir(pk),
              destroy: () => this.destroyPath(pk)
            } as DatabaseReturn<T>[D]
          } else {
            json.writeSync(path, data)

            return {
              ...data,
              save: this.saveFile(pk),
              destroy: () => this.destroyPath(pk)
            } as DatabaseReturn<T>[D]
          }
        }

        return undefined
      }

      if (this.databaseType === DatabaseType.Dir) {
        return this.readDirSync(pk) as DatabaseReturn<T>[D]
      } else {
        return this.readSync(path, pk) as DatabaseReturn<T>[D]
      }
    } else {
      let result = await this.model.findByPk(pk)
      if (!result && create) {
        result = await this.model.create(this.schemaToJSON(pk))
      }
      if (!result) return undefined

      return {
        ...result.toJSON<T>(),
        save: this.saveSql(result, pk),
        destroy: () => this.destroySql(pk)
      }
    }
  }

  async findAllByPks (pks: string[]): Promise<DatabaseReturn<T>[D][]> {
    if (this.databaseType !== DatabaseType.Db) {
      const result: DatabaseReturn<T>[D][] = []
      pks.forEach((pk) => {
        const path = this.userPath(pk)
        if (existsSync(path)) {
          if (this.databaseType === DatabaseType.Dir) {
            result.push(this.readDirSync(pk) as DatabaseReturn<T>[D])
          } else {
            result.push(this.readSync(path, pk) as DatabaseReturn<T>[D])
          }
        }
      })

      return result
    } else {
      const result = await this.model.findAll({
        where: {
          [this.model.primaryKeyAttribute]: pks
        }
      })

      return result.map((item) => ({
        ...item.toJSON<T>(),
        save: this.saveSql(item, item[this.model.primaryKeyAttribute as keyof Model<any, any>]),
        destroy: () => this.destroySql(item[this.model.primaryKeyAttribute as keyof Model<any, any>])
      }))
    }
  }

  async findAll (excludePks?: string[]): Promise<DatabaseReturn<T>[D][]> {
    const excludeSet = new Set(excludePks || [])

    if (this.databaseType !== DatabaseType.Db) {
      const result: DatabaseReturn<T>[D][] = []
      const files = fs.readdirSync(this.databasePath)

      if (this.databaseType === DatabaseType.Dir) {
        files.forEach((file) => {
          if (excludeSet.has(file)) return

          const stat = fs.statSync(path.join(this.databasePath, file))
          if (stat.isDirectory()) {
            result.push(this.readDirSync(file) as DatabaseReturn<T>[D])
          }
        })
      } else {
        files.forEach((file) => {
          if (!file.endsWith('.json')) return

          const pk = file.replace('.json', '')
          if (excludeSet.has(pk)) return

          result.push(this.readSync(this.userPath(pk), pk) as DatabaseReturn<T>[D])
        })
      }

      return result
    } else {
      const whereClause = excludePks && excludePks.length > 0
        ? { [this.model.primaryKeyAttribute]: { [Op.notIn]: excludePks } }
        : {}

      const result = await this.model.findAll({ where: whereClause })

      return result.map((item) => ({
        ...item.toJSON<T>(),
        save: this.saveSql(item, item[this.model.primaryKeyAttribute as keyof Model<any, any>]),
        destroy: () => this.destroySql(item[this.model.primaryKeyAttribute as keyof Model<any, any>])
      }))
    }
  }

  async destroy (pk: string): Promise<boolean> {
    if (this.databaseType !== DatabaseType.Db) {
      rmSync(this.userPath(pk), { recursive: true })

      return true
    } else {
      const destroyed = await this.model.destroy({
        where: { [this.model.primaryKeyAttribute]: pk }
      })

      return destroyed > 0
    }
  }
}

export const Sqlite3Static = new class Sqlite3Static implements DatabaseClassStatic {
  dialect = dialect
  description = '插件默认数据库'

  Column<T> (
    type: keyof typeof DataTypes, def: T, option?: Partial<ModelAttributeColumnOptions<Model>>
  ): ModelAttributeColumnOptions<Model> {
    return {
      type: DataTypes[type],
      defaultValue: def,
      ...option
    }
  }

  ArrayColumn<T> (
    key: string, fn?: (data: DatabaseArray<T>) => T[]
  ): ModelAttributeColumnOptions<Model> {
    return {
      type: DataTypes.STRING,
      defaultValue: [].join(','),
      get (): DatabaseArray<T> {
        const data = this.getDataValue(key).split(',').filter(Boolean)
        return new DatabaseArray<T>(data)
      },
      set (data: DatabaseArray<T>) {
        const setData = (fn ? fn(data) : data) || []
        this.setDataValue(key, setData.join(','))
      }
    }
  }

  JsonColumn<T> (
    key: string, def: T
  ): ModelAttributeColumnOptions<Model> {
    return {
      type: DataTypes.STRING,
      defaultValue: JSON.stringify(def),
      get (): T {
        let data = this.getDataValue(key)
        try {
          data = JSON.parse(data) || def
        } catch (e) {
          data = def
        }
        return data
      },
      set (data: T) {
        this.setDataValue(key, JSON.stringify(data))
      }
    }
  }
}()
