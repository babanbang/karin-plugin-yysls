import { Dialect } from '@/module/database'

export interface ConfigType {
  database: DataBaseConfig
  dailySign: DailySignConfig
}

export interface DataBaseConfig {
  dialect: Dialect
}

export interface DailySignConfig {
}
