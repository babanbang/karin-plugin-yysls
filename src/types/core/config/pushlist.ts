import { CommandEnum } from '@/types/apps'
import { Contact } from 'node-karin'

export interface PushListType {
  globalMaster: PushTargetType[]
  globalAdmin: PushTargetType[]
  [CommandEnum.DailySignTask]: PushContactType[]
}

export interface PushContactType {
  botId: string
  contact: Contact
}

export interface PushTargetType {
  botId: string
  targetId: string
}
