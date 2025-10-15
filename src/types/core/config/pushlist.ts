import { CommandEnum } from '@/types/apps'
import { Contact, SendMessage } from 'node-karin'

export interface PushListType {
  globalMaster: PushTargetType
  globalAdmin: PushTargetType
  [CommandEnum.DailySignTask]: PushContactType
}

export type PushContactType = Record<string, Contact[]>

export type PushTargetType = Record<string, string[]>

export interface PushContactMsgType {
  botId: string
  contact: Contact
  message: SendMessage
}

export interface PushTargetMsgType {
  botId: string
  targetId: string
  message: SendMessage
}
