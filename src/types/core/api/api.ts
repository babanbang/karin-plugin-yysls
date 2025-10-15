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
    /** @description 门派ID */
    school: number
    /** @description 风华值 */
    fashionScore: number
  }
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
