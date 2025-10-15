import { dir } from '@/dir'
import { ApiInfoFn } from '@/types/core'
import { logger, redis } from 'node-karin'
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
    return await this.#requestData(this.#apiInfo, data)
  }

  /**
   * 优先获取缓存数据
   */
  async requestCache (key: string, seconds: number, data: D): Promise<R> {
    const redisKey = `${dir.name}:apiCache:${key}`

    const cache = await redis.get(redisKey)
    if (cache) {
      try {
        return JSON.parse(cache) as R
      } catch (err) {
        logger.error(`[${dir.name}] redisCache(${key}) json parse error:`, err)
      }
    }

    const result = await this.#requestData(this.#apiInfo, data)

    if (seconds > 0) {
      await redis.setEx(key, seconds, JSON.stringify(result))
    }

    return result
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
