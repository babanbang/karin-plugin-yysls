import { CommandEnum } from '@/types/apps'

export type CommandType = Record<CommandEnum, CommandItem>

export interface CommandItem {
  /**
   * @description 触发指令
   */
  cmds: string[]
  /**
   * @description 是否启用指令
   */
  enable: boolean
  /**
   * @description 是否强制保留默认指令
   */
  default: boolean
  /**
   * @description 忽略大小写
   */
  flags: boolean
}
