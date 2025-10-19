import { CumulativeFigItem, dailySign, getCumulativeFigData } from '@/core/api'
import { Command } from '@/core/command'
import { BlackListCfg, Cfg, CommandCfg, DailySignPermission, DailySignTaskPermission, PushContactMsgType, PushContactType, PushListCfg, WhiteListCfg } from '@/core/config'
import { AccountInfoDB, AccountInfoType } from '@/core/database'
import { User } from '@/core/user'
import { dir } from '@/dir'
import { CommandEnum, CumulativeFigListItem, DailySignTaskStatus, signInfoType } from '@/types/apps'
import { common, renderTemplate } from '@/utils'
import karin, { redis, segment } from 'node-karin'
import lodash from 'node-karin/lodash'

const CHINESE_MONTH_NAMES = [
  '一月',
  '二月',
  '三月',
  '四月',
  '五月',
  '六月',
  '七月',
  '八月',
  '九月',
  '十月',
  '十一月',
  '十二月',
]

export const DailySign = karin.command(
  Command.getCommand(CommandEnum.DailySign, '$'),
  async (e, next) => {
    if (!CommandCfg.get<boolean>(`${CommandEnum.DailySign}.enable`)) {
      next()

      return false
    }

    switch (Cfg.get<DailySignPermission>(`${CommandEnum.DailySign}.permission`)) {
      case DailySignPermission.Master:
        if (!e.isMaster) return true

        break
      case DailySignPermission.Admin:
        if (!(e.isAdmin || e.isMaster)) return true

        break
      case DailySignPermission.MemberWhite: {
        if (e.isAdmin || e.isMaster) break

        const whiteList = WhiteListCfg.get<string>(`${CommandEnum.DailySign}.members`, true)
        if (!whiteList.has(e.userId)) return true

        break
      }
      case DailySignPermission.MemberBlack: {
        if (e.isAdmin || e.isMaster) break

        const blackList = BlackListCfg.get<string>(`${CommandEnum.DailySign}.members`, true)
        if (blackList.has(e.userId)) return true

        break
      }
      case DailySignPermission.GroupWhite: {
        if (e.isAdmin || e.isMaster) break

        if (!e.isGroup) return true

        const whiteList = WhiteListCfg.get<string>(`${CommandEnum.DailySign}.groups`, true)
        if (!whiteList.has(e.groupId)) return true

        break
      }
      case DailySignPermission.GroupBlack: {
        if (e.isAdmin || e.isMaster) break

        if (!e.isGroup) return true

        const blackList = BlackListCfg.get<string>(`${CommandEnum.DailySign}.groups`, true)
        if (blackList.has(e.groupId)) return true

        break
      }
      case DailySignPermission.Everyone:
        break
    }

    const user = await User.create(e.userId, true)

    const uidInfoList = user.uidInfoList
    if (uidInfoList.length === 0) {
      await e.reply('请先绑定角色！', { at: true })

      return true
    }

    const renderData: {
      month: string
      signList: {
        uidInfo: { uid: string, name: string, avatar: string, main: boolean }
        signInfo: signInfoType
      }[]
      cumulativeFigList: CumulativeFigListItem[]
    } = {
      month: CHINESE_MONTH_NAMES[new Date().getMonth()],
      signList: [],
      cumulativeFigList: []
    }

    const msgs: string[] = []
    for (const uidInfo of uidInfoList) {
      const signResult = await Sign(uidInfo, false)
      if (!signResult.success) {
        msgs.push(`${uidInfo.name}(${uidInfo.uid})：${signResult.msg}`)
      } else {
        renderData.signList.push({
          uidInfo: {
            uid: uidInfo.uid, name: uidInfo.name, avatar: uidInfo.avatar, main: uidInfo.main
          },
          signInfo: signResult.data!.signInfo
        })

        if (renderData.cumulativeFigList.length === 0) {
          renderData.cumulativeFigList = signResult.data!.cumulativeFigList.map(cumulativeFig => {
            const split = cumulativeFig.calendarVoList[0].prizeName.split('*')

            return {
              days: cumulativeFig.days,
              AttainList: cumulativeFig.isAttain ? [{ name: uidInfo.name, avatar: uidInfo.avatar }] : [],
              reward: {
                name: split[0], num: split[1], color: cumulativeFig.calendarVoList[0].colorType
              }
            }
          })
        } else {
          signResult.data!.cumulativeFigList.forEach(cumulativeFig => {
            if (cumulativeFig.isAttain) {
              const item = renderData.cumulativeFigList.find(item => item.days === cumulativeFig.days)

              item!.AttainList.push({ name: uidInfo.name, avatar: uidInfo.avatar })
            }
          })
        }
      }
    }

    if (msgs.length > 0) {
      await e.reply(msgs.join('\n'), { at: true })
    }

    if (renderData.signList.length > 0) {
      const image = await renderTemplate(CommandEnum.DailySign, renderData)

      await e.reply(segment.image(image), { at: true })
    }

    return true
  }
)

export const DailySignTask = karin.command(
  Command.getCommand(CommandEnum.DailySignTask, '$'),
  async (e, next) => {
    if (!CommandCfg.get<boolean>(`${CommandEnum.DailySignTask}.enable`)) {
      next()

      return false
    }

    SignTask(false)

    return true
  }
)

export const AutoDailySignTask = karin.task(
  '腌鱼十六升每日定时签到',
  Cfg.get<string>(`${CommandEnum.DailySignTask}.corn`),
  async () => {
    SignTask(true)

    return true
  },
  { log: false }
)

const SignTask = async (isAuto: boolean) => {
  if (isAuto && !Cfg.get<boolean>(`${CommandEnum.DailySignTask}.auto`)) return false

  const dailySignPermission = Cfg.get<DailySignTaskPermission>(`${CommandEnum.DailySignTask}.permission`)

  const SignTaskList: AccountInfoType[] = []

  switch (dailySignPermission) {
    case DailySignTaskPermission.UidWhite: {
      const uids = WhiteListCfg.get<string>(`${CommandEnum.DailySignTask}.uids`, true)

      const accounts = await (await AccountInfoDB()).findAllByPks(uids)

      SignTaskList.push(...accounts)
      break
    }
    case DailySignTaskPermission.UidBlack: {
      const uids = BlackListCfg.get<string>(`${CommandEnum.DailySignTask}.uids`, true)

      const accounts = await (await AccountInfoDB()).findAll(uids)

      SignTaskList.push(...accounts)
      break
    }
    default: {
      const accounts = await (await AccountInfoDB()).findAll()

      SignTaskList.push(...accounts)
      break
    }
  }

  const TaskStatus: DailySignTaskStatus = {
    name: '每日福利', signed: 0, success: 0, expired: 0, failed: 0
  }
  const failList: { uid: string, name: string, avatar: string }[] = []
  const expiredList: { uid: string, name: string, avatar: string }[] = []

  for (const account of SignTaskList) {
    const signResult = await Sign(account, true)

    switch (signResult.code) {
      case -100:
        failList.push({ uid: account.uid, name: account.name, avatar: account.avatar })

        TaskStatus.failed++
        break
      case -1:
        expiredList.push({ uid: account.uid, name: account.name, avatar: account.avatar })

        TaskStatus.expired++
        break
      case 0:
        TaskStatus.success++
        break
      case 1:
        TaskStatus.signed++
        break
    }
  }

  const renderData: {
    signStatus: DailySignTaskStatus & {
      List: {
        name: string,
        data: { uid: string, name: string, avatar: string }[]
      }[]
    }
  } = {
    signStatus: {
      ...TaskStatus, List: []
    }
  }

  if (expiredList.length > 0) {
    renderData.signStatus.List.push({ name: 'access_token过期', data: expiredList })
  }
  if (failList.length > 0) {
    renderData.signStatus.List.push({ name: '签到失败', data: failList })
  }

  const image = segment.image(await renderTemplate(CommandEnum.DailySignTask, renderData))
  if (isAuto) {
    const botPushList = PushListCfg.get<PushContactType>(CommandEnum.DailySignTask)
    const pushList: PushContactMsgType[] = []

    lodash.forEach(botPushList, (contacts, botId) => {
      pushList.push(...contacts.map(contact => ({ botId, contact, message: image })))
    })

    await common.pushMsgTo('Contact', { pushList })
  }

  for (const key of Cfg.get<'Master' | 'Admin'>(`${CommandEnum.DailySignTask}.globalPush`, true)) {
    await common.pushMsgTo(key, {
      msgFn: (item) => ({ ...item, message: image })
    })
  }

  return true
}

const Sign = async (accountInfo: AccountInfoType, isTask: boolean): Promise<{
  code: number
  success: boolean
  msg: string
  data?: {
    signInfo: signInfoType
    cumulativeFigList: CumulativeFigItem[]
  }
}> => {
  const signResult = await dailySign.new(accountInfo).requestCache(
    `dailySign:${accountInfo.uid}`, common.getRemainSecondsOfToday() - 10, null
  )

  switch (signResult.code) {
    case -1:
      return { code: -1, success: false, msg: 'access_token已过期，请重新绑定！' }
    case -100044:
      if (isTask) {
        return { code: 1, success: true, msg: '今日已签到' }
      }
    // eslint-disable-next-line no-fallthrough
    case 200: {
      const cumulativeFigData = await getCumulativeFigData.new(accountInfo).requestCache(
        `${dir.name}:CumulativeFigData:${accountInfo.uid}`, common.getRemainSecondsOfToday() - 10, null
      )

      const cumulativeFigList = cumulativeFigData.data?.cumulativeFigList ?? []
      const maxAttained = lodash.maxBy(
        lodash.filter(cumulativeFigList, item => item.isAttain),
        'days'
      )

      const rewards = maxAttained!.calendarVoList.map(item => {
        const split = item.prizeName.split('*')

        return {
          name: split[0], num: split[1], color: item.colorType
        }
      })

      await redis.setEx(
        `${dir.name}:dailySign:${accountInfo.uid}`,
        common.getRemainSecondsOfToday(),
        JSON.stringify({ day: maxAttained!.days, rewards })
      )

      return {
        code: 0,
        success: true,
        msg: '签到成功！',
        data: {
          signInfo: {
            days: maxAttained!.days,
            integral: signResult.data?.integral ?? 0,
            rewards
          },
          cumulativeFigList
        }
      }
    }
    default:
      return { code: -100, success: false, msg: `签到失败！${signResult.msg}(code:${signResult.code})` }
  }
}
