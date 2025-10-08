import { dailySign, getCumulativeFigData } from '@/core/api'
import { Command } from '@/core/command'
import { CommandCfg } from '@/core/config'
import { User } from '@/core/user'
import { CommandEnum, CumulativeFigListItem, signInfoType } from '@/types/apps'
import { CumulativeFigItem } from '@/types/core'
import { UidInfoType } from '@/types/core/user'
import { renderTemplate } from '@/utils'
import karin, { segment } from 'node-karin'
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
    if (!CommandCfg.get<boolean>(`${CommandEnum.DailySign}.enable`)) next()

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
      const signResult = await Sign(uidInfo)
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

const Sign = async (uidInfo: UidInfoType): Promise<{
  success: boolean
  msg: string
  data?: {
    signInfo: signInfoType
    cumulativeFigList: CumulativeFigItem[]
  }
}> => {
  const signResult = await dailySign.new(uidInfo).request(null)

  switch (signResult.code) {
    case -1:
      return { success: false, msg: 'access_token已过期，请重新绑定！' }
    case -100044:
    case 200: {
      const cumulativeFigData = await getCumulativeFigData.new(uidInfo).request(null)

      const cumulativeFigList = cumulativeFigData.data?.cumulativeFigList ?? []
      const maxAttained = lodash.maxBy(
        lodash.filter(cumulativeFigList, item => item.isAttain),
        'days'
      )

      return {
        success: true,
        msg: '签到成功！',
        data: {
          signInfo: {
            days: maxAttained!.days,
            integral: signResult.data?.integral ?? 0,
            rewards: maxAttained!.calendarVoList.map(item => {
              const split = item.prizeName.split('*')

              return {
                name: split[0], num: split[1], color: item.colorType
              }
            })
          },
          cumulativeFigList
        }
      }
    }
    default:
      return { success: false, msg: `签到失败！${signResult.msg}(code:${signResult.code})` }
  }
}
