import { dir } from '@/dir'
import { existsSync, logger, requireFileSync, watch, writeJsonSync } from 'node-karin'
import lodash from 'node-karin/lodash'
import { EnhancedArray } from './array'

export interface ConfigIgnore<T> {
  defaultConfig: T
}

export interface ConfigIgnoreArray<T> {
  defaultConfig: T[]
  defaultConfigItem: {
    defaultConfig: T
  }
}

export class Config<C extends Record<string, any>> {
  /**
    * @description 配置缓存
    */
  #ConfigCache: C | null = null
  /**
    * @description 默认配置
    */
  #DefaultConfig: C
  #IgnoreConfig: Record<string, any>
  /**
    * @description 配置保存路径
    */
  #ConfigPath: string

  constructor (ConfigPath: string, DefaultConfig: C, IgnoreConfig: Record<string, any>) {
    this.#ConfigPath = ConfigPath
    this.#DefaultConfig = DefaultConfig
    this.#IgnoreConfig = IgnoreConfig

    !existsSync(ConfigPath) && writeJsonSync(ConfigPath, DefaultConfig)

    this.loadConfig()
  }

  loadConfig (): C {
    const config = requireFileSync(this.#ConfigPath)

    // 检查并补全缺失的配置项
    const mergedConfig = this.mergeWithDefaults(config, this.#DefaultConfig, this.#IgnoreConfig)

    // 更新缓存
    this.#ConfigCache = mergedConfig

    return mergedConfig
  }

  mergeWithDefaults (userConfig: Record<string, any>, defaultConfig: Record<string, any>, IgnoreConfig: Record<string, any>): C {
    // 递归函数，用于过滤掉用户配置中不存在于默认配置的字段
    const filterUserConfig = (user: any, defaults: any, Ignore: any): any => {
      if (Array.isArray(user) && Array.isArray(defaults)) {
        if (Ignore?.defaultConfigItem) {
          const filtered: any[] = []

          user.forEach((value, key) => {
            filtered[key] = filterUserConfig(value, Ignore.defaultConfigItem.defaultConfig, Ignore.defaultConfigItem.defaultConfig)
          })

          return filtered
        }

        return user
      } else if (lodash.isPlainObject(user) && lodash.isPlainObject(defaults)) {
        const filtered: Record<string, any> = {}

        const mergedValue = lodash.merge({}, defaults, user)

        if (Ignore?.defaultConfig) {
          lodash.forEach(user, (value, key) => {
            // 合并用户配置和默认配置，确保动态键也包含完整字段
            const mergedValue = lodash.merge(Array.isArray(value) ? [] : {}, Ignore.defaultConfig, value)

            filtered[key] = filterUserConfig(mergedValue, Ignore.defaultConfig, Array.isArray(value) ? Ignore : Ignore[key])
          })
        }

        lodash.forEach(defaults, (value, key) => {
          filtered[key] = filterUserConfig(mergedValue[key], value, Ignore?.[key])
        })

        return filtered
      }

      return user
    }

    // 先过滤用户配置，只保留默认配置中定义的字段
    const filteredUserConfig = filterUserConfig(userConfig, defaultConfig, IgnoreConfig)

    // 然后合并配置
    const result = lodash.merge({}, defaultConfig, filteredUserConfig)

    if (!lodash.isEqual(result, userConfig)) {
      try {
        writeJsonSync(this.#ConfigPath, result)
      } catch (err) {
        logger.error(err)
      }
    }

    return result
  }

  /**
* @description 获取配置路径对应的默认配置
*/
  getDef<T> (path: string) {
    const defConfig = JSON.parse(JSON.stringify(this.#DefaultConfig))

    return lodash.get(defConfig, path) as T
  }

  /**
 * @description 获取配置路径对应的配置
 */
  get<T> (path: string, isArray?: false, def?: T): T
  get<T> (path: string, isArray: true, def?: T[]): EnhancedArray<T>
  get<T> (path: string, isArray: boolean = false, def?: T): T | EnhancedArray<T> {
    const conf = JSON.parse(JSON.stringify(this.#ConfigCache))

    const result = path ? lodash.get(conf, path, def) : conf

    if (isArray) {
      if (!Array.isArray(result)) {
        logger.error(`配置路径 ${path} 不是数组类型`)
        return new EnhancedArray<T>(this, [], path)
      }

      return new EnhancedArray<T>(this, result, path)
    }

    return result
  }

  /**
   * @param save 是否立即保存
   */
  set<T> (path: string, value: T, save: boolean): void {
    lodash.set(this.#ConfigCache!, path, value)

    save && this.save()
  }

  /**
   * @description 立即保存配置
   */
  save () {
    try {
      logger.debug(`[${dir.name}] 保存配置`, this.#ConfigCache)

      writeJsonSync(this.#ConfigPath, this.#ConfigCache)
    } catch (err) {
      logger.error(err)
    }
  }

  watch () {
    watch(this.#ConfigPath, () => {
      this.loadConfig()
    })

    return this
  }
}
