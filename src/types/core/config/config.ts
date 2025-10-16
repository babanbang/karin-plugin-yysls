import { Dialect } from '@/module/database'

export interface ConfigType {
  database: DataBaseConfig
  dailySign: DailySignConfig
  dailySignTask: DailySignTaskConfig
}

export interface DataBaseConfig {
  dialect: Dialect
}

export const enum DailySignPermission {
  Master = 'master',
  Admin = 'admin',
  MemberWhite = 'memberWhite',
  MemberBlack = 'memberBlack',
  GroupWhite = 'groupWhite',
  GroupBlack = 'groupBlack',
  Everyone = 'everyone'
}

export interface DailySignConfig {
  permission: DailySignPermission
}

export const enum DailySignTaskPermission {
  UidWhite = 'uidWhite',
  UidBlack = 'uidBlack',
  MemberWhite = 'memberWhite',
  MemberBlack = 'memberBlack',
  Everyone = 'everyone'
}

export interface DailySignTaskConfig {
  auto: boolean
  corn: string
  globalPush: ('Master' | 'Admin')[]
  permission: DailySignTaskPermission
}
