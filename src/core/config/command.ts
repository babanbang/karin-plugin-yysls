import { dir } from '@/dir'
import { Config } from '@/module/config'
import { CommandEnum } from '@/types'
import { CommandType } from '@/types/core/config'
import path from 'node:path'

const CommandPath = path.join(dir.ConfigDir, 'command.json')

const DefaultCommand: CommandType = {
  [CommandEnum.Login]: {
    cmds: ['燕云(十六声)?绑定'], enable: true, default: true, flags: false
  },
  [CommandEnum.DailySign]: {
    cmds: ['燕云(十六声)?签到'], enable: true, default: true, flags: false
  },
  [CommandEnum.DailySignTask]: {
    cmds: ['燕云(十六声)?签到任务'], enable: true, default: true, flags: false
  },
  [CommandEnum.ShowRoleList]: {
    cmds: ['燕云(十六声)?(角色列表|uid)'], enable: true, default: true, flags: false
  },
  [CommandEnum.GameInfo]: {
    cmds: ['燕云(十六声)?角色信息'], enable: true, default: true, flags: false
  }
}

export const CommandCfg = new Config(CommandPath, DefaultCommand, {}).watch()
