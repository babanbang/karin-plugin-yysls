import { DatabaseArray } from '@/module/database'

export interface UserInfoType {
  userId: string
  mainUid: string
  uidList: DatabaseArray<string>
}
