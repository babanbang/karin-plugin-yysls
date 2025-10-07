import { dir } from '@/dir'
import { ApiInfoFn } from '@/types/core'
import { logger } from 'node-karin'
import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'node-karin/axios'

export class DefineApi<
  R extends Record<string, any> | null = null,
  D extends Record<string, any> | null = null,
  U extends Record<string, any> | null = null
> {
  declare UserInfo: U

  #apiInfo: ApiInfoFn<R, D, U>

  constructor (apiInfo: ApiInfoFn<R, D, U>) {
    this.#apiInfo = apiInfo
  }

  new (userInfo: U) {
    this.UserInfo = userInfo

    return this
  }

  async request (data: D): Promise<R> {
    return this.#requestData(this.#apiInfo, data)
  }

  async next<
    R extends Record<string, any> | null = null,
    D extends Record<string, any> | null = null
  > (apiInfo: ApiInfoFn<R, D>, data: D): Promise<R> {
    return this.#requestData(apiInfo, data)
  }

  async #requestData (apiInfo: ApiInfoFn<any, any, any>, data: any): Promise<any> {
    const { Url, Body, Method, Options = {}, HeaderFn, Result } = apiInfo(this, data)

    const Headers = new AxiosHeaders(await HeaderFn())

    const params: AxiosRequestConfig = {
      url: Url.href, method: Method, data: Body, headers: Headers
    }

    const start = Date.now()
    let response: AxiosResponse<any, any>
    try {
      if (Method === 'GET') {
        response = await axios.get(params.url!, {
          headers: params.headers, ...Options
        })
      } else if (Method === 'POST') {
        response = await axios.post(params.url!, params.data, {
          headers: params.headers, ...Options
        })
      } else {
        response = await axios.request(params)
      }
    } catch (err) {
      logger.debug(`[${dir.name}] requst-error(${logger.green(`${Date.now() - start}ms`)}): ${JSON.stringify(params, null, 2)}`, err)

      return null as any
    }

    const res = Result ? Result(response) : response.data

    logger.debug(`[${dir.name}] requst-success(${logger.green(`${Date.now() - start}ms`)}): ${JSON.stringify(params, null, 2)} -> ${JSON.stringify(res, null, 2)}`)

    return res
  }

  Headers = () => ({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090c11)XWEB/11581',
    'Accept-Encoding': 'gzip, deflate, br',
    xweb_xhr: '1',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'accept-language': 'zh-CN,zh;q=0.9'
  })
}
