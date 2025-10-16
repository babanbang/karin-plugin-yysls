import { PushListCfg } from '@/core/config'
import { CommandEnum } from '@/types/apps'
import karin, { Contact, config as karinCfg } from 'node-karin'

export const setGlobalPush = karin.command(
  '#燕云(十六声)?(添加|删除)全局(主人|管理员)推送',
  async (e, next) => {
    const [, , setType, role, _setId = ''] = e.msg.match(/#燕云(十六声)?(添加|删除)全局(主人|管理员)推送(.*)/)!

    const setId = _setId.trim() || e.userId

    let permission = ''
    if (role === '主人' && new Set(karinCfg.master()).has(setId)) {
      permission = 'Master'
    } else if (role === '管理员' && new Set(karinCfg.admin()).has(setId)) {
      permission = 'Admin'
    }

    if (!permission) {
      await e.reply(`${setId} 不是${role}!`, { at: true })

      return true
    }

    const globalBotPush = PushListCfg.get<string>(`global${permission}.${e.selfId}`, true, [])

    switch (setType) {
      case '添加':
        globalBotPush.add(setId, true, true)
        break
      case '删除':
        globalBotPush.remove(setId, true)
        break
    }

    await e.reply(`${setId} 全局推送${setType}成功!`, { at: true })

    return true
  },
  {
    permission: 'admin'
  }
)

export const normalPushKeys: Record<string, CommandEnum> = {
  签到任务: CommandEnum.DailySignTask,
}

export const setNormalPush = karin.command(
  `#燕云(十六声)?(开启|关闭)(${Object.keys(normalPushKeys).join('|')})推送$`,
  async (e, next) => {
    const [, , setType, key] = e.msg.match(new RegExp(`#燕云(十六声)?(开启|关闭)(${Object.keys(normalPushKeys).join('|')})推送`))!
    const command = normalPushKeys[key]

    if (setType === '开启') {
      switch (command) {
        default: {
          const botPush = PushListCfg.get<Contact>(`${command}.${e.selfId}`, true, [])

          botPush.add(e.contact, true, true)
          break
        }
      }
    } else {
      const botPush = PushListCfg.get<Contact>(`${command}.${e.selfId}`, true, [])

      botPush.remove((contact) => contact.peer === e.contact.peer && contact.subPeer === e.contact.subPeer, true)
    }

    await e.reply(`${key}推送${setType}成功!`, { at: true })

    return true
  },
  {
    permission: 'admin'
  }
)
