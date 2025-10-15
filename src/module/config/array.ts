import { logger } from 'node-karin'
import lodash from 'node-karin/lodash'
import { Config } from './config'

export class EnhancedArray<T> extends Array<T> {
  #keyPath: string
  #cfg: Config<any>

  constructor (cfg: Config<any>, items: T[], path: string) {
    super()

    Object.setPrototypeOf(this, EnhancedArray.prototype)
    if (Array.isArray(items)) {
      this.push(...items)
    }

    this.#cfg = cfg
    this.#keyPath = path
  }

  /**
   * @param element - string | number
   * @returns
   */
  has (element: T & (string | number)): boolean {
    return new Set(this).has(element)
  }

  /**
   * @param isEqual 是否不添加重复元素
   * @param save 是否立即保存
   */
  add (element: T, isEqual: boolean, save: boolean): this {
    if (isEqual) {
      const existingSet = new Set(this.map(item => JSON.stringify(item)))

      if (existingSet.has(JSON.stringify(element))) return this
    }

    this.push(element)
    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)

    return this
  }

  /**
   * @param isEqual 是否不添加重复元素
   * @param save 是否立即保存
   */
  addSome (elements: T[], isEqual: boolean, save: boolean): this {
    if (isEqual) {
      const existingSet = new Set(this.map(item => JSON.stringify(item)))

      elements = elements.filter(element => !existingSet.has(JSON.stringify(element)))

      if (elements.length === 0) return this
    }

    this.push(...elements)
    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)

    return this
  }

  /**
   * @param predicate - 要删除的元素、删除条件函数或索引
   * @param save - 是否立即保存
   * @param isIndex - 当 predicate 为数字时，是否将其视为索引
   */
  remove (predicate: T & number, save: boolean, isIndex: true): this
  remove (predicate: T | ((item: T) => boolean), save: boolean): this
  remove (predicate: T | ((item: T) => boolean), save: boolean, isIndex: boolean = false): this {
    if (isIndex && lodash.isNumber(predicate)) {
      if (predicate < 0 || predicate >= this.length) {
        logger.error(`索引 ${predicate} 超出范围 [0, ${this.length - 1}]`)
        return this
      }
      lodash.pullAt(this, predicate)
    } else if (lodash.isFunction(predicate)) {
      lodash.remove(this as T[], predicate)
    } else {
      lodash.pull(this, predicate)
    }

    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)

    return this
  }

  /**
  * @param predicate - 要删除的元素数组
  * @param save - 是否立即保存
  */
  removeSome (elements: T[], save: boolean): this {
    lodash.pullAll(this, elements)

    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)
    return this
  }

  clear () {
    this.length = 0
    return this
  }
}
