import { Equip, Qishu, Wuxue } from '@/core/resources'
import { CumulativeFigResponse, DailySignResponse, GameInfoResponse, wearEquipsDetailedRow } from '@/types'
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
      const rowData = response.data?.data
      if (!rowData) {
        return { data: response.data, row: response.data }
      }

      const responseData: GameInfoResponse = JSON.parse(JSON.stringify(response.data))

      responseData.data.kongfuMain = rowData.kongfuMain
        ? { ...Wuxue.get(rowData.kongfuMain, rowData.kongMainLevel), equip: Equip.get(rowData.wearEquips['1']) }
        : undefined
      responseData.data.kongfuSub = rowData.kongfuSub
        ? { ...Wuxue.get(rowData.kongfuSub, rowData.kongSubLevel), equip: Equip.get(rowData.wearEquips['2']) }
        : undefined

      responseData.data.battleQs = Object.entries(rowData.battleQs).map(([idx, qs]) => (
        { idx, ...Qishu.get(qs as number, rowData.battleQsLevel[String(qs)]) }
      ))

      const sort = ['1', '2', '10', '11', '3', '4', '5', '8', '9', '21']
      responseData.data.wearEquipsDetailed = []
      sort.forEach(idx => {
        const equip = (rowData.wearEquipsDetailed as wearEquipsDetailedRow)[idx]
        responseData.data.wearEquipsDetailed.push({
          idx,
          ...Equip.get(Number(equip.no)),
          durability: equip.exVo.durability,
          suffix: Equip.getSuit(equip.exVo.suffix),
          attrs: Object.entries(equip.exVo.baseAttrs).map(([key, value]) => Equip.getProp(key, value).data),
          affixes: equip.exVo.baseAffixes.map(affix => Equip.getTiaolv(affix.equipmentDetails).data)
        })
      })

      const account = await (await AccountInfoDB()).findByPk(rowData.roleId)
      account && await account.save({
        name: rowData.roleName,
        level: rowData.level,
        club: rowData.clubName,
        avatar: rowData.roleAvatar
      })

      return {
        data: responseData, row: response.data
      }
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
