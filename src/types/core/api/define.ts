import { DefineApi } from '@/core/api'
import { AxiosRequestConfig, AxiosResponse } from 'node-karin/axios'

export type ApiInfoFn<
  /** 请求参数 */
  R extends Record<string, any> | null = null,
  /** 响应数据 */
  D extends Record<string, any> | null = null,
  U extends Record<string, any> | null = null
> = (self: DefineApi<R, D, U>, data: D) => {
  Url: URL
  Body?: any
  Method: 'GET' | 'POST'
  Options?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data' | 'headers'>
  HeaderFn: () => Record<string, string> | Promise<Record<string, string>>
  /** 对响应数据进行处理 */
  Result?: (response: AxiosResponse) => R
}
