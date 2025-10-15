import { existToMkdirSync, json, logger, rmSync } from 'node-karin'
import lodash from 'node-karin/lodash'
import fs from 'node:fs'
import path from 'node:path'
import { Model, ModelStatic } from 'sequelize'
import { DatabaseReturn, DatabaseType, ModelAttributes } from '../types'

export class DbBase<T extends Record<string, any>, D extends DatabaseType> {
  declare model: ModelStatic<Model>

  declare databasePath: string
  declare databaseType: D

  declare modelName: string
  declare modelSchema: ModelAttributes<Model>

  initBase (DataDir: string, modelName: string, modelSchema: ModelAttributes<Model>, type: D) {
    this.databaseType = type
    this.databasePath = path.join(DataDir, modelName)
    if (type !== DatabaseType.Db) {
      existToMkdirSync(this.databasePath)
    }

    this.modelName = modelName
    this.modelSchema = modelSchema
  }

  schemaToJSON (pk: string): T {
    const result: Record<string, any> = {
      [this.model.primaryKeyAttribute]: pk
    }
    lodash.forEach(this.modelSchema, (value, key) => {
      if (key !== this.model.primaryKeyAttribute) {
        result[key] = typeof value.defaultValue === 'function' ? value.defaultValue() : value.defaultValue
      }
    })

    return result as T
  }

  userPath (pk: string) {
    if (this.databaseType === DatabaseType.Dir) {
      return path.join(this.databasePath, pk)
    }

    return path.join(this.databasePath, `${pk}.json`)
  }

  readSync (path: string, pk: string): DatabaseReturn<T>[DatabaseType.File] {
    const result: DatabaseReturn<T>[D] = json.readSync(path)

    result.save = this.saveFile(pk)
    result.destroy = () => this.destroyPath(pk)

    return result
  }

  readDirSync (pk: string): DatabaseReturn<T>[DatabaseType.Dir] {
    const path = this.userPath(pk)
    const files = fs.readdirSync(path)

    const result: Record<string, any> = {
      save: this.saveDir(pk),
      destroy: () => this.destroyPath(pk),
      [this.model.primaryKeyAttribute]: pk
    }
    const filePromises = files.map(async (file) => {
      const data = await json.read(`${path}/${file}`)
      result[data.key] = data.data
    })

    Promise.all(filePromises).then().catch((err) => {
      logger.error(err)
    })

    return result as DatabaseReturn<T>[D]
  }

  writeDirSync (pk: string, data: Record<string, any>) {
    const path = this.userPath(pk)
    lodash.forEach(this.modelSchema, (value, key) => {
      if (key !== this.model.primaryKeyAttribute) {
        const result = {
          key,
          [this.model.primaryKeyAttribute]: pk,
          data: data[key] || value.defaultValue
        }
        json.writeSync(`${path}/${key}.json`, result)
      }
    })
    return true
  }

  saveFile (pk: string): (data: T) => Promise<DatabaseReturn<T>[DatabaseType.File]> {
    return async (data: Partial<T>) => {
      delete data[this.model.primaryKeyAttribute]

      const defData = this.schemaToJSON(pk)
      const userPath = this.userPath(pk)

      json.writeSync(userPath, lodash.merge({}, defData, data))

      return this.readSync(userPath, pk)
    }
  }

  saveDir (pk: string): (data: T) => Promise<DatabaseReturn<T>[DatabaseType.Dir]> {
    return async (data: Partial<T>) => {
      delete data[this.model.primaryKeyAttribute]

      this.writeDirSync(pk, data)

      return this.readDirSync(pk)
    }
  }

  destroyPath (pk: string): Promise<boolean> {
    return new Promise((resolve) => {
      const userPath = this.userPath(pk)

      try {
        rmSync(userPath, { recursive: true })

        resolve(true)
      } catch (err) {
        logger.error(err)

        resolve(false)
      }
    })
  }

  saveSql (model: Model<any, any>, pk: string): (data: Partial<T>) => Promise<DatabaseReturn<T>[DatabaseType.Db]> {
    return async (data: Partial<T>) => {
      delete data[this.model.primaryKeyAttribute]

      const result = await model.update(data)

      return {
        ...result.toJSON<T>(),
        save: this.saveSql(result, pk),
        destroy: () => this.destroySql(pk)
      }
    }
  }

  destroySql (pk: string): Promise<boolean> {
    return new Promise((resolve) => {
      const result = this.model.destroy({ where: { [this.model.primaryKeyAttribute]: pk } })
        .then(count => count > 0).catch(() => false)

      resolve(result)
    })
  }
}
