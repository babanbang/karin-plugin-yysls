import { dir } from '@/dir'
import { Config } from '@/module/config'
import { CommandEnum } from '@/types'
import { PushListType } from '@/types/core/config'
import path from 'node:path'

const PushListPath = path.join(dir.ConfigDir, 'pushlist.json')

const DefaultPushList: PushListType = {
  globalMaster: [],
  globalAdmin: [],
  [CommandEnum.DailySignTask]: []
}

export const PushListCfg = new Config(PushListPath, DefaultPushList)
