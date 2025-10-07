import { CommandCfg } from '@/core/config'
import { CommandEnum, CommandItem } from '@/types'
import { Command as KarinCommand, logger, MessageEventMap } from 'node-karin'

export const Command = new class CommandClass {
  #cmds = new Map<CommandEnum, { command: KarinCommand<keyof MessageEventMap>, end: '$' | '' }>()

  new (key: CommandEnum, command: KarinCommand<keyof MessageEventMap>, end: '$' | '' = '') {
    this.#cmds.set(key, { command, end })

    this.#setReg(key, command, end)
  }

  update (key: CommandEnum) {
    const cmd = this.#cmds.get(key)
    if (!cmd) {
      logger.error(`未找到指令: ${key}`)
      return false
    }

    this.#setReg(key, cmd.command, cmd.end)
    return true
  }

  #setReg (key: CommandEnum, command: KarinCommand<keyof MessageEventMap>, end: '$' | '') {
    // const reg = this.getCommand(key, end)

  }

  /**
     * @description 获取触发指令正则表达式
     */
  getCommand (cmd: CommandEnum, end: '$' | ''): RegExp {
    const command = CommandCfg.get<CommandItem>(cmd)

    return new RegExp(`^#?(${command.cmds.join('|')})${end}`, command.flags ? 'i' : undefined)
  }
}()
