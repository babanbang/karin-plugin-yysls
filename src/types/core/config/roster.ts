import { CommandEnum } from '@/types/apps'

export interface RosterType {
  [CommandEnum.DailySign]: {
    global: RosterItemType
    [key: string]: RosterItemType
  }
}

export interface RosterItemType {
  /** @description Uid名单 */
  uids: string[]
  /** @description 成员名单 */
  members: string[]
  /** @description 群名单 */
  groups: string[]
}
