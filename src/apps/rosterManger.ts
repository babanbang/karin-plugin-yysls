import { BlackListCfg, WhiteListCfg } from '@/core/config'
import { CommandEnum } from '@/types/apps'
import karin from 'node-karin'

export const rosterKeys: Record<string, CommandEnum> = {
  签到: CommandEnum.DailySign,
}

export const setRoster = karin.command(
  `#燕云(十六声)?(添加|删除)(bot|全局)(${Object.keys(rosterKeys).join('|')})(群|uid)?(白|黑)名单`,
  async (e, next) => {
    const [, , setType, isBot, key, scope, listType, _setId = ''] = e.msg.match(new RegExp(`#燕云(十六声)?(添加|删除)(bot|全局)(${Object.keys(rosterKeys).join('|')})(群|uid)?(白|黑)名单(.*)`))!

    const setId = _setId.trim().split('|')
    if (setId.length === 0) {
      if (scope === '群') {
        if (!e.isGroup) {
          await e.reply('请在群内使用此命令，或指定GroupId！', { at: true })
          return true
        }
        setId.push(e.groupId)
      } else if (scope === 'uid') {
        await e.reply(`请指定要${setType}的uid！`, { at: true })
        return true
      } else {
        if (e.at.length > 0) {
          setId.push(...e.at)
        } else {
          setId.push(e.userId)
        }
      }
    }

    const command = rosterKeys[key]
    const scopeType = scope === '群' ? 'groups' : scope === 'uid' ? 'uids' : 'members'

    const rosterList = (listType === '白' ? WhiteListCfg : BlackListCfg).get<string>(`${command}.${isBot ? e.selfId : 'global'}.${scopeType}`, true)

    if (setType === '添加') {
      rosterList.addSome(setId, true, true)
    } else {
      rosterList.removeSome(setId, true)
    }

    await e.reply(`${setId.join(',')} 「${isBot === 'bot' ? ('Bot:' + e.selfId) : '全局'}」${listType}名单${setType}成功!`, { at: true })

    return true
  },
  {
    permission: 'admin'
  }
)
