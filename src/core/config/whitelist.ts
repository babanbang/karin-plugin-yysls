import { dir } from '@/dir'
import { Config } from '@/module/config'
import { CommandEnum } from '@/types'
import { RosterType } from '@/types/core/config'
import path from 'node:path'

const WhiteListPath = path.join(dir.ConfigDir, 'whitelist.json')

const DefaultWhiteList: RosterType = {
  [CommandEnum.DailySign]: {
    global: {
      uids: [], members: [], groups: []
    }
  }
}

export const WhiteListCfg = new Config(WhiteListPath, DefaultWhiteList, {
  [CommandEnum.DailySign]: {
    defaultConfig: {
      uids: [], members: [], groups: []
    }
  }
})
