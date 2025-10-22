import { GameInfoResponse, getGameInfo } from '@/core/api'
import { Command } from '@/core/command'
import { Cfg, CommandCfg } from '@/core/config'
import { Xinfa } from '@/core/resources/xinfa'
import { User } from '@/core/user'
import { XinfaItem } from '@/types'
import { CommandEnum } from '@/types/apps'
import { renderTemplate } from '@/utils'
import karin, { segment } from 'node-karin'

export const showGameInfo = karin.command(
  Command.getCommand(CommandEnum.showGameInfo, ''),
  async (e, next) => {
    if (!CommandCfg.get<boolean>(`${CommandEnum.Login}.enable`)) next()

    const user = await User.create(e.userId, false)

    const gameInfo = await getGameInfo.init({ accessToken: user.info.accessToken }).requestCache(
      `gameInfo:${user.mainUid}`, 300, null
    )

    switch (gameInfo.code) {
      case 200:
        break
      case -1:
        await e.reply('access_token已过期，请重新绑定！', { at: true })
        return true
      default:
        await e.reply(`获取角色信息失败，error：${gameInfo.msg}！`, { at: true })
        return true
    }

    const renderData: {
      baseInfo: {
        bg: GameInfoResponse['data']['bg']
        head: {
          id: GameInfoResponse['data']['roleId']
          name: GameInfoResponse['data']['roleName']
          level: GameInfoResponse['data']['level']
          club: GameInfoResponse['data']['clubName']
          crDay: GameInfoResponse['data']['roleBaseInfoVo']['crDay']
          avatar: GameInfoResponse['data']['roleAvatar']
        },
        tips: { lable: string; value: string | number }[]
      }
      planInfo: {
        xiuWei: { now: GameInfoResponse['data']['xiuWeiKungFu'], dif: number }
        kongfu: Record<'main' | 'sub', GameInfoResponse['data']['kongfuMain']>
        xinfa: (XinfaItem & { rank: number })[]
        qishu: GameInfoResponse['data']['battleQs']
      }
      // exploreInfo: { area: string; level: number; score: number; name: string; value: number }[]
      pagination: boolean
    } = {
      baseInfo: {
        bg: gameInfo.data.bg,
        head: {
          id: gameInfo.data.roleId,
          name: gameInfo.data.roleName,
          level: gameInfo.data.level,
          club: gameInfo.data.clubName,
          crDay: gameInfo.data.roleBaseInfoVo.crDay,
          avatar: gameInfo.data.roleAvatar,
        },
        tips: [{
          lable: '游戏时长', value: (gameInfo.data.onlineTime / 3600).toFixed(1) + 'h'
        }, {
          lable: '最高造诣', value: gameInfo.data.maxXiuWeiKungFu
        }, {
          lable: '风华值', value: gameInfo.data.fashionScore
        }, {
          lable: '探索造诣', value: Number(gameInfo.data.roleBaseInfoVo.xiuweiExplore).toFixed(0)
        }, {
          lable: '悬壶造诣', value: Number(gameInfo.data.roleBaseInfoVo.xiuweiTrade4).toFixed(0)
        }, {
          lable: '话术造诣', value: Number(gameInfo.data.roleBaseInfoVo.xiuweiTrade3).toFixed(0)
        }],
      },
      planInfo: {
        xiuWei: {
          now: gameInfo.data.xiuWeiKungFu,
          dif: gameInfo.data.maxXiuWeiKungFu - gameInfo.data.xiuWeiKungFu
        },
        kongfu: {
          main: gameInfo.data.kongfuMain,
          sub: gameInfo.data.kongfuSub
        },
        xinfa: gameInfo.data.passiveSlots.map(id => Xinfa.get(id, gameInfo.data.xinfaInfo[id].rank)),
        qishu: gameInfo.data.battleQs
      },
      // exploreInfo: [{
      //   area: '清河', ...common.getExploreLevel(gameInfo.data.scores58)!
      // }, {
      //   area: '开封', ...common.getExploreLevel(gameInfo.data.scores59)!
      // }, {
      //   area: '河西', ...common.getExploreLevel(gameInfo.data.scores60)!
      // }, {
      //   area: '不见山', ...common.getExploreLevel(gameInfo.data.scores61)!
      // }],
      pagination: Cfg.get<boolean>(`${CommandEnum.showGameInfo}.pagination`)
    }

    const image = await renderTemplate(CommandEnum.showGameInfo, renderData, 'png')

    await e.reply(segment.image(image), { at: true })

    return true
  }
)
