import { Command } from '@/core/command'
import { CommandCfg } from '@/core/config'
import { UidInfoType, User } from '@/core/user'
import { dir } from '@/dir'
import { CommandEnum, rewardItem } from '@/types/apps'
import { renderTemplate } from '@/utils'
import karin, { logger, Message, redis, segment } from 'node-karin'

const showRoleListCmd = Command.getCommand(CommandEnum.ShowRoleList, '')

export const showRoleList = async (e: Message) => {
  const user = await User.create(e.userId, true)

  if (user.uidList.length > 1) {
    const idx = Number(e.msg.replace(showRoleListCmd, '').trim())
    if (!isNaN(idx) && idx > 0 && idx <= user.uidList.length + 1) {
      user.saveUserInfo({
        mainUid: user.uidList[idx - 1],
      })
    }

    await user.refresh(true)
  }

  const renderData: {
    roleList: (Omit<UidInfoType, 'accessToken'> & {
      dailySign: { day: number, rewards: rewardItem[] }
    })[]
  } = {
    roleList: []
  }

  await Promise.all(user.uidInfoList.map(async uidInfo => {
    const { accessToken, ...rest } = uidInfo

    const cache = await redis.get(`${dir.name}:dailySign:${uidInfo.uid}`).then(res => {
      try {
        return res ? JSON.parse(res) as { day: number, rewards: rewardItem[] } : { day: 0, rewards: [] }
      } catch (err) {
        logger.error(err)

        return { day: 0, rewards: [] }
      }
    })

    renderData.roleList.push({
      ...rest, dailySign: cache
    })
  }))

  const image = await renderTemplate(CommandEnum.ShowRoleList, renderData)

  await e.reply(segment.image(image), { at: true })

  return true
}

export const ShowRoleList = karin.command(
  showRoleListCmd,
  async (e, next) => {
    if (!CommandCfg.get<boolean>(`${CommandEnum.ShowRoleList}.enable`)) {
      next()

      return false
    }

    return await showRoleList(e)
  }
)
