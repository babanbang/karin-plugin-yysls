import { logger } from 'node-karin'
import lodash from 'node-karin/lodash'
import { DataTypes, Model, ModelAttributeColumnOptions, ModelStatic } from 'sequelize'

export const enum Dialect {
  Sqlite = 'sqlite',
  MySQL = 'mysql',
  MariaDB = 'mariadb',
  PostgreSQL = 'postgres',
  MSSQL = 'mssql',
  Oracle = 'oracle',
  DB2 = 'db2',
  Snowflake = 'snowflake',
}

export enum DatabaseType {
  File = 'file',
  Dir = 'dir',
  Db = 'db',
}

export type ModelAttributes<M extends Model = Model, TAttributes = any> = {
  /**
   * The description of a database column
   */
  [name in keyof TAttributes]: ModelAttributeColumnOptions<M>
}

export interface DatabaseReturn<T> {
  [DatabaseType.Db]: T & {
    save: (data: Partial<T>) => Promise<DatabaseReturn<T>[DatabaseType.Db]>
    destroy: () => Promise<boolean>
  }
  [DatabaseType.File]: T & {
    save: (data: T) => Promise<DatabaseReturn<T>[DatabaseType.File]>
    destroy: () => Promise<boolean>
  }
  [DatabaseType.Dir]: T & {
    save: (data: T) => Promise<DatabaseReturn<T>[DatabaseType.Dir]>
    destroy: () => Promise<boolean>
  }
}

export type DatabaseClassInstance<T extends Record<string, any>, D extends DatabaseType> = {
  model: ModelStatic<Model>

  databasePath: string
  databaseType: D

  /** @description 表名 */
  modelName: string

  /** @description 表定义 */
  modelSchema: ModelAttributes<Model>

  /** @description 检查数据库是否可用 */
  check (): Promise<boolean>

  /**
   * @description 初始化表
   * @param DataDir 插件数据目录
   * @param modelName 表名
   * @param modelSchema 表定义
   * @param type 数据库类型
   */
  init (DataDir: string, modelName: string, modelSchema: Record<keyof T, ModelAttributeColumnOptions<Model>>, type: D): Promise<DatabaseClassInstance<T, D>>

  /** @description 将表定义转换为 JSON 对象 */
  schemaToJSON (pk: string): T

  /** @description 获取用户数据文件路径 */
  userPath (pk: string): string

  /** @description 根据主键读取用户数据文件 */
  readSync (path: string, pk: string): DatabaseReturn<T>[DatabaseType.File]

  /** @description 根据主键读取用户数据目录 */
  readDirSync (pk: string): DatabaseReturn<T>[DatabaseType.Dir]

  /** @description 写入用户数据目录 */
  writeDirSync (pk: string, data: Record<string, any>): boolean

  /** @description 保存用户数据到文件 */
  saveFile (pk: string): (data: T) => Promise<DatabaseReturn<T>[DatabaseType.File]>

  /** @description 保存用户数据到目录 */
  saveDir (pk: string): (data: T) => Promise<DatabaseReturn<T>[DatabaseType.Dir]>

  /** @description 保存用户数据到 SQL 数据库 */
  saveSql (model: Model<any, any>, pk: string): (data: Partial<T>) => Promise<DatabaseReturn<T>[DatabaseType.Db]>

  /** @description 根据主键查找并创建用户数据 */
  findByPk (pk: string, create: true): Promise<DatabaseReturn<T>[D]>

  /** @description 根据主键查找用户数据 */
  findByPk (pk: string, create?: boolean): Promise<DatabaseReturn<T>[D] | undefined>

  /** @description 根据主键数组查找用户数据 */
  findAllByPks (pks: string[]): Promise<DatabaseReturn<T>[D][]>

  /** @description 获取所有用户数据 */
  findAll (): Promise<DatabaseReturn<T>[D][]>

  /** @description 获取除 excludePks 以外所有用户数据 */
  findAll (excludePks: string[]): Promise<DatabaseReturn<T>[D][]>

  /** @description 删除用户数据 */
  destroy (pk: string): Promise<boolean>
}

export interface DatabaseClassStatic {
  /** @description 数据库标识 */
  dialect: Dialect
  /** @description 数据库说明 */
  description: string

  Column<T> (
    type: keyof typeof DataTypes, def: T, option?: Partial<ModelAttributeColumnOptions<Model>>
  ): ModelAttributeColumnOptions<Model>

  ArrayColumn<T> (
    key: string, fn?: (data: DatabaseArray<T>) => T[]
  ): ModelAttributeColumnOptions<Model>

  JsonColumn<T extends Record<string, any>> (
    key: string, def: T
  ): ModelAttributeColumnOptions<Model>
}

export class DatabaseArray<T> extends Array<T> {
  constructor (items: T[]) {
    super()

    Object.setPrototypeOf(this, DatabaseArray.prototype)
    if (Array.isArray(items)) {
      this.push(...items)
    }
  }

  /**
 * @param element - string | number
 * @returns
 */
  has (element: T & (string | number)): boolean {
    return new Set(this).has(element)
  }

  /**
   * @param isEqual 是否不添加重复元素
   */
  add (element: T, isEqual: boolean): this {
    if (isEqual) {
      const existingSet = new Set(this.map(item => JSON.stringify(item)))

      if (existingSet.has(JSON.stringify(element))) return this
    }

    this.push(element)

    return this
  }

  /**
   * @param isEqual 是否不添加重复元素
   */
  addSome (elements: T[], isEqual: boolean): this {
    if (isEqual) {
      const existingSet = new Set(this.map(item => JSON.stringify(item)))

      elements = elements.filter(element => !existingSet.has(JSON.stringify(element)))

      if (elements.length === 0) return this
    }

    this.push(...elements)

    return this
  }

  /**
   * @param isIndex predicate是否为索引
   */
  remove (predicate: T | ((item: T) => boolean), isIndex: boolean = false): this {
    let newArr: T[] = []

    if (isIndex && lodash.isNumber(predicate)) {
      if (predicate < 0 || predicate >= this.length) {
        logger.error(`DatabaseArray索引 ${predicate} 超出范围`)
        return this
      }
      newArr = [...this.slice(0, predicate), ...this.slice(predicate + 1)]
    } else if (lodash.isFunction(predicate)) {
      newArr = this.filter(item => !predicate(item))
    } else {
      newArr = lodash.without(this, predicate)
    }

    // 清空当前数组并添加新元素
    this.length = 0
    this.push(...newArr)

    return this
  }

  clear () {
    this.length = 0

    return this
  }
}
