export interface rewardItem {
  name: string
  num: string
  color: number
}

export interface signInfoType {
  days: number
  integral: number
  rewards: rewardItem[]
}

export interface CumulativeFigListItem {
  days: number
  AttainList: {
    name: string
    avatar: string
  }[]
  reward: rewardItem
}
