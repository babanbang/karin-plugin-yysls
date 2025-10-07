import { DatabaseClassInstance, DatabaseType } from './dbs'

export type DatabaseFn = <T extends Record<string, any>, D extends DatabaseType> () => DatabaseClassInstance<T, D>
