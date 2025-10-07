import { DatabaseReturn, DatabaseType } from '@/module/database'
import { AccountInfoType, UidInfoType, UserInfoType, UserType } from '@/types/core'
import { AccountInfoDB, UserInfoDB } from '../database/tables'

export class User {
  userId: UserInfoType['userId']

  #uidMap: Map<string, DatabaseReturn<AccountInfoType>[DatabaseType.Db]> = new Map()

  declare UserInfo: DatabaseReturn<UserInfoType>[DatabaseType.Db]

  constructor (userId: string) {
    this.userId = userId
  }

  get mainUid () {
    return this.UserInfo.mainUid
  }

  get uidList () {
    return this.UserInfo.uidList
  }

  get info (): Readonly<UserType> {
    const AccountInfo = this.#uidMap.get(this.mainUid)

    return Object.freeze({
      userId: this.userId,
      mainUid: this.mainUid,
      accessToken: AccountInfo?.accessToken || '',
      uidInfoList: this.uidInfoList,
    })
  }

  get uidInfoList (): Readonly<UidInfoType>[] {
    const mainUid = this.mainUid

    return Array.from(this.#uidMap.values()).map(accountInfo => Object.freeze({
      ...accountInfo, main: accountInfo.uid === mainUid,
    }))
  }

  getUidInfo (uid: string): Readonly<UidInfoType> | undefined {
    const mainUid = this.mainUid

    const accountInfo = this.#uidMap.get(uid)
    if (!accountInfo) return undefined

    return Object.freeze({
      ...accountInfo, main: accountInfo.uid === mainUid,
    })
  }

  /**
   *
   * @param userId
   * @param all 是否获取全部数据
   */
  static async create (userId: UserInfoType['userId'], all: boolean) {
    const userInfo = new User(userId)

    const userInfoDB = await UserInfoDB()

    const UserInfoData = await userInfoDB.findByPk(userId, true)

    await userInfo.initAccountInfo(UserInfoData, all)

    return userInfo
  }

  async refresh (all: boolean) {
    const userInfoDB = await UserInfoDB()

    const UserInfoData = await userInfoDB.findByPk(this.userId, true)

    await this.initAccountInfo(UserInfoData, all)
  }

  async initAccountInfo (UserInfo: DatabaseReturn<UserInfoType>[DatabaseType.Db], all: boolean) {
    this.UserInfo = UserInfo

    this.#uidMap.clear()

    const accountInfoDB = await AccountInfoDB()

    if (all && this.uidList.length > 0) {
      const AccountInfoList = await accountInfoDB.findAllByPks(this.uidList)
      AccountInfoList.forEach((AccountInfo) => {
        this.#uidMap.set(AccountInfo.uid, AccountInfo)
      })
    } else if (this.mainUid) {
      const AccountInfo = await accountInfoDB.findByPk(this.mainUid, true)
      this.#uidMap.set(AccountInfo.uid, AccountInfo)
    }
  }

  async saveUserInfo (data: Partial<UserInfoType>) {
    await this.UserInfo.save(data)
  }

  async saveAccountInfo (uid: string, data: Partial<AccountInfoType>) {
    let AccountInfo = this.#uidMap.get(uid)
    if (!AccountInfo) {
      const accountInfoDB = await AccountInfoDB()

      AccountInfo = await accountInfoDB.findByPk(uid, true)
    }

    await AccountInfo.save(data)
    this.#uidMap.set(uid, { ...AccountInfo, ...data })
  }
}
