import { AccountInfoType } from '../database'

export interface UserType {
  userId: string
  mainUid: string
  accessToken: string
  uidInfoList: UidInfoType[]
}

export interface UidInfoType extends AccountInfoType {
  main: boolean
}
