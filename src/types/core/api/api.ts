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
    /** 头像ID */
    roleAvatar: string
    /** 百业 */
    clubName: string
    level: number
    /** 上次登录时间 */
    loginTime: number
    /** 总在线时长 */
    onlineTime: number
    /** 门派ID */
    school: number
    /** 风华值 */
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
  /** 是否已签到 */
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
