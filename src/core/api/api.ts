import { CumulativeFigResponse, DailySignResponse, GameInfoResponse } from '@/types'
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
