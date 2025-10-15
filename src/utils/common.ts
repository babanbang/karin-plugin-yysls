import { PushContactType, PushListCfg, PushTargetType } from '@/core'
import karin, { Contact, SendMessage } from 'node-karin'
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
  pushList: {
    botId: string; contact: Contact; message: SendMessage
  }[]
}): Promise<boolean>

export async function pushMsgTo (to: 'Master' | 'Admin', data: {
  msgFn: (item: PushTargetType) => (PushTargetType & { message: SendMessage })
}): Promise<boolean>

export async function pushMsgTo (
  to: 'Contact' | 'Master' | 'Admin',
  data: {
    pushList?: (PushContactType & { message: SendMessage })[]
    msgFn?: (item: PushTargetType) => (PushTargetType & { message: SendMessage })
  }
): Promise<boolean> {
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

      const pushList = PushListCfg.get<PushTargetType>(`global${to}`, true).filter(
        item => botIds.has(item.botId)
      ).map(data.msgFn!)

      for (const pushItem of pushList) {
        await karin[`send${to}`](pushItem.botId, pushItem.targetId, pushItem.message)

        await sleep(random(500, 1500))
      }
    }
  }
  return true
}
