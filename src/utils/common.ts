import { PushContactMsgType, PushListCfg, PushTargetMsgType } from '@/core'
import karin, { SendMessage } from 'node-karin'
import lodash from 'node-karin/lodash'
import moment from 'node-karin/moment'

/**
 * @description 生成随机数
 * @param min - 最小值
 * @param max - 最大值
 * @returns
 */
export const random = (min: number, max: number) => lodash.random(min, max)

/**
 * @description 睡眠函数
 * @param ms - 毫秒
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * @description 使用moment返回时间
 * @param format - 格式
 */
export const time = (format = 'YYYY-MM-DD HH:mm:ss') => moment().format(format)

/**
 * @description 获取从现在到今天结束的剩余秒数
 */
export const getRemainSecondsOfToday = () => moment().endOf('day').diff(moment(), 'seconds')

/**
 * @description 主动推送消息
 */
export async function pushMsgTo (to: 'Contact', data: {
  pushList: PushContactMsgType[]
}): Promise<boolean>
export async function pushMsgTo (to: 'Master' | 'Admin', data: {
  msgFn: (item: Omit<PushTargetMsgType, 'message'>) => PushTargetMsgType
}): Promise<boolean>
export async function pushMsgTo (to: 'Contact' | 'Master' | 'Admin', data: {
  pushList?: PushContactMsgType[]
  msgFn?: (item: Omit<PushTargetMsgType, 'message'>) => PushTargetMsgType
}): Promise<boolean> {
  switch (to) {
    case 'Contact': {
      const botIds = new Set(karin.getAllBotID())
      const pushList = data.pushList!.filter(item => botIds.has(item.botId))

      if (pushList.length === 0) return false

      for (const pushItem of pushList) {
        await karin.sendMsg(pushItem.botId, pushItem.contact!, pushItem.message)

        await sleep(random(500, 1500))
      }

      break
    }
    case 'Admin':
    case 'Master': {
      const botIds = new Set(karin.getAllBotID())

      const pushList: { botId: string; targetId: string; message: SendMessage }[] = []
      for (const botId of botIds) {
        const botPushList = PushListCfg.get<string>(`global${to}.${botId}`, true, [])

        pushList.push(...botPushList.map(targetId => data.msgFn!({ botId, targetId })))
      }

      for (const pushItem of pushList) {
        await karin[`send${to}`](pushItem.botId, pushItem.targetId, pushItem.message)

        await sleep(random(500, 1500))
      }
    }
  }
  return true
}

export const getExploreLevel = (_num: number) => {
  const Tsd = [{
    level: 6, score: 9000, name: '名震一方'
  }, {
    level: 5, score: 6000, name: '威名远扬'
  }, {
    level: 4, score: 4000, name: '功绩显赫'
  }, {
    level: 3, score: 3000, name: '登堂入室'
  }, {
    level: 2, score: 2000, name: '声名鹊起'
  }, {
    level: 1, score: 1000, name: '初来乍到'
  }, {
    level: 0, score: 0, name: '默默无闻'
  }]

  const num = Math.max(0, Number(_num))
  for (const TsdItem of Tsd) {
    if (num >= TsdItem.score) {
      return { ...TsdItem, value: num }
    }
  }
}
