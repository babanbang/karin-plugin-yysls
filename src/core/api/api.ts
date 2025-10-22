import { Equip, Qishu, Wuxue } from '@/core/resources'
import { CumulativeFigResponse, DailySignResponse, GameInfoResponse } from '@/types'
import { AccountInfoDB } from '../database'
import { DefineApi } from './define'

const HOST = 'https://s3.game.163.com/7540694694f2dddc/'

export const getGameInfo = new DefineApi<
  GameInfoResponse,
  null,
  { accessToken: string }
>(
  (self, _data) => ({
    Method: 'GET',
    HeaderFn: self.Headers,
    Url: new URL(HOST + 'game/regional/data?access_token=' + self.UserInfo.accessToken),
    Result: async (response) => {
      const responseData = response.data

      responseData.data.kongfuMain = responseData.data.kongfuMain
        ? { ...Wuxue.get(responseData.data.kongfuMain, responseData.data.kongMainLevel), equip: Equip.get(responseData.data.wearEquips['1']) }
        : undefined
      responseData.data.kongfuSub = responseData.data.kongfuSub
        ? { ...Wuxue.get(responseData.data.kongfuSub, responseData.data.kongSubLevel), equip: Equip.get(responseData.data.wearEquips['2']) }
        : undefined

      responseData.data.battleQs = Object.entries(responseData.data.battleQs).map(([idx, qs]) => (
        { idx, ...Qishu.get(String(qs), responseData.data.battleQsLevel[String(qs)]) }
      ))

      const account = await (await AccountInfoDB()).findByPk(responseData.data.roleId)
      if (account) {
        await account.save({
          name: responseData.data.roleName,
          level: responseData.data.level,
          club: responseData.data.clubName,
          avatar: responseData.data.roleAvatar
        })
      }

      return responseData
    }
  })
)

export const getCumulativeFigData = new DefineApi<
  CumulativeFigResponse,
  null,
  { accessToken: string }
>(
  (self, data) => ({
    Method: 'GET',
    HeaderFn: self.Headers,
    Url: new URL(HOST + 'integral/cumulative/fig?access_token=' + self.UserInfo.accessToken),
  })
)

export const dailySign = new DefineApi<
  DailySignResponse,
  null,
  { accessToken: string }
>(
  (self, data) => ({
    Method: 'GET',
    HeaderFn: self.Headers,
    Url: new URL(HOST + 'user/sign?access_token=' + self.UserInfo.accessToken),
  })
)
