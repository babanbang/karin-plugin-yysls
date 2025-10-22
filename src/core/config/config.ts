import { dir } from '@/dir'
import { Config } from '@/module/config'
import { Dialect } from '@/module/database'
import { CommandEnum } from '@/types/apps'
import { ConfigType, DailySignPermission, DailySignTaskPermission } from '@/types/core/config'
import path from 'node:path'

const ConfigPath = path.join(dir.ConfigDir, 'config.json')

const DefaultConfig: ConfigType = {
  database: {
    dialect: Dialect.Sqlite,
  },
  [CommandEnum.DailySign]: {
    permission: DailySignPermission.Everyone,
  },
  [CommandEnum.DailySignTask]: {
    auto: false,
    cron: '0 30 8 * * *',
    globalPush: ['Master'],
    permission: DailySignTaskPermission.Everyone
  },
  [CommandEnum.showGameInfo]: {
    pagination: true
  }
}

export const Cfg = new Config(ConfigPath, DefaultConfig, {}).watch()
