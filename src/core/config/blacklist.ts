import { dir } from '@/dir'
import { Config } from '@/module/config'
import { CommandEnum } from '@/types'
import { RosterIgnoreType, RosterType } from '@/types/core/config'
import path from 'node:path'

const BlackListPath = path.join(dir.ConfigDir, 'blacklist.json')

const DefaultBlackList: RosterType = {
  [CommandEnum.DailySign]: {
    global: {
      uids: [], members: [], groups: []
    }
  }
}

const DefaultBlackListIgnore: RosterIgnoreType = {
  [CommandEnum.DailySign]: {
    defaultConfig: {
      uids: [], members: [], groups: []
    }
  }
}

export const BlackListCfg = new Config(BlackListPath, DefaultBlackList, DefaultBlackListIgnore).watch()
