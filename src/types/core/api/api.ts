import { EquipItem, QishuItem, WuxueItem } from '../resources'

export interface BaseApiReponse {
  status: boolean
  success: boolean
  code: number
  msg: string
}

export interface GameInfoResponse extends BaseApiReponse {
  data: {
    roleId: string
    roleName: string
    /** @description 头像ID */
    roleAvatar: string
    /** @description 百业 */
    clubName: string
    level: number
    /** @description 上次登录时间 */
    loginTime: number
    /** @description 总在线时长 */
    onlineTime: number
    /** @description 角色创建时间 */
    createTime: number
    /** @description 门派ID */
    school: number
    /** @description 顶部卡片背景 */
    bg: number
    /** 清河探索 */
    scores58: number
    /** 开封探索 */
    scores59: number
    /** 河西探索 */
    scores60: number
    /** 不见山探索 */
    scores61: number
    /** @description 历史最高修为 */
    maxXiuWeiKungFu: number
    /** @description 当前方案修为 */
    xiuWeiKungFu: number
    /** @description 风华值 */
    fashionScore: number
    /** @description 主武学 */
    kongfuMain?: WuxueItem & { level: number; equip: EquipItem }
    /** @description 副武学 */
    kongfuSub?: WuxueItem & { level: number; equip: EquipItem }
    /** @description 装配奇术 */
    battleQs: (QishuItem & { level: number; idx: string })[]
    /** @description 装备详情 */
    wearEquipsDetailed: Record<string, EquipDetailItem>
    /** @description 心法详情 */
    passiveSlots: string[]
    xinfaInfo: Record<string, { rank: number }>
    roleBaseInfoVo: {
      /** @description 游历天数 */
      crDay: number
      createRoleDate: string
      /** @description 探索造诣 */
      xiuweiExplore: string
      /** @description 话术造诣 */
      xiuweiTrade3: string
      /** @description 悬壶造诣 */
      xiuweiTrade4: string
    }
  }
}

export interface EquipDetailItem {
  /** @description 装备ID */
  no: string
}

export interface CumulativeFigResponse extends BaseApiReponse {
  data: {
    cumulativeFigList: CumulativeFigItem[]
  }
}

export interface CumulativeFigItem {
  days: number
  /** @description 是否已签到 */
  isAttain: boolean
  calendarVoList: CalendarVoItem[]
}

export interface DailySignResponse extends BaseApiReponse {
  data: {
    integral: number
    rewardCalendarVos: CalendarVoItem[]
  }
}

export interface CalendarVoItem {
  prizeName: string
  prizeUrl: string
  prizeDesc: string
  isReal: boolean
  isSpar: boolean
  colorType: number
}
