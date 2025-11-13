import { dir } from '@/dir'
import { Config } from '@/module/config'
import { CommandEnum } from '@/types'
import { PushListIgnoreType, PushListType } from '@/types/core/config'
import path from 'node:path'

const PushListPath = path.join(dir.ConfigDir, 'pushlist.json')

const DefaultPushList: PushListType = {
  globalMaster: {},
  globalAdmin: {},
  [CommandEnum.DailySignTask]: {}
}

const DefaultPushListIgnore: PushListIgnoreType = {
  globalMaster: {
    defaultConfig: [],
    defaultConfigItem: {
      defaultConfig: ''
    }
  },
  globalAdmin: {
    defaultConfig: [],
    defaultConfigItem: {
      defaultConfig: ''
    }
  },
  [CommandEnum.DailySignTask]: {
    defaultConfig: [],
    defaultConfigItem: {
      defaultConfig: {
        scene: 'group', peer: '', name: '', subPeer: undefined
      },
      required: ['scene', 'peer']
    }
  }
}

export const PushListCfg = new Config(PushListPath, DefaultPushList, DefaultPushListIgnore).watch()
