import { dir } from '@/dir'
import { Config } from '@/module/config'
import { Dialect } from '@/module/database'
import { ConfigType } from '@/types/core/config'
import path from 'node:path'

const ConfigPath = path.join(dir.ConfigDir, 'config.json')

const DefaultConfig: ConfigType = {
  database: {
    dialect: Dialect.Sqlite,
  },
  dailySign: {

  }
}

export const Cfg = new Config(ConfigPath, DefaultConfig)
