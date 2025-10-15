import { karin, logger } from 'node-karin'
import lodash from 'node-karin/lodash'
import { DataTypes, Model, ModelAttributeColumnOptions } from 'sequelize'
import { Sqlite3, Sqlite3Static } from './dbs/sqlite3'
import { DatabaseClassStatic, DatabaseFn, DatabaseType, Dialect } from './types'

karin.handler('YYSLS.Database.default', async (args, next) => {
  if (!args.Database || !args.Static) {
    return next()
  }
  if (!lodash.isFunction(args.Database)) {
    await Database.Add(
      args.Database as DatabaseFn,
      args.Static as DatabaseClassStatic
    )
  } else {
    logger.error('设置默认数据库失败: Database 必须是一个函数！')
  }
})

export const Database = new class DatabaseClass {
  #defaultDialect = Dialect.Sqlite
  #DatabaseMap: Map<Dialect, { Database: DatabaseFn, Static: DatabaseClassStatic }> = new Map()

  default (dialect: Dialect) {
    const db = this.#DatabaseMap.get(dialect)
    if (!db) {
      logger.error(`未找到数据库: ${dialect}！使用默认数据库。`)

      return
    }
    this.#defaultDialect = dialect
  }

  /** @description 添加数据库 */
  async Add (Database: DatabaseFn, Static: DatabaseClassStatic) {
    const db = Database()
    if (await db.check()) {
      this.#DatabaseMap.set(Static.dialect, { Database, Static })
    } else {
      logger.error(`${Static.dialect} check failed!`)
    }
  }

  get Db () {
    const dialect = this.#defaultDialect

    const db = this.#DatabaseMap.get(dialect)
    if (!db) {
      logger.error(`未找到数据库: ${dialect}！使用默认数据库。`)

      return this.#DatabaseMap.get(Dialect.Sqlite)!
    }
    return db!
  }

  get details (): { dialect: Dialect, desc: string }[] {
    return Array.from(this.#DatabaseMap.entries()).map(([dialect, { Static }]) => ({
      dialect, desc: Static.description
    }))
  }

  /** @description 获取当前使用的数据库 */
  get<T extends Record<string, any>, D extends DatabaseType> () {
    return this.Db.Database<T, D>()
  }

  get PkColumn () {
    return (
      type: keyof typeof DataTypes, option?: Partial<ModelAttributeColumnOptions<Model>>
    ): ModelAttributeColumnOptions<Model> => ({
      type: DataTypes[type],
      primaryKey: true,
      allowNull: false,
      ...option
    })
  }

  get Column (): DatabaseClassStatic['Column'] {
    return this.Db.Static.Column
  }

  get ArrayColumn (): DatabaseClassStatic['ArrayColumn'] {
    return this.Db.Static.ArrayColumn
  }

  get JsonColumn (): DatabaseClassStatic['JsonColumn'] {
    return this.Db.Static.JsonColumn
  }
}()

await Database.Add(
  <T extends Record<string, any>, D extends DatabaseType> () => new Sqlite3<T, D>(),
  Sqlite3Static
)
