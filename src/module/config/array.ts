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
   * @param isEqual 是否不添加重复元素
   * @param save 是否立即保存
   */
  add (element: T, isEqual: boolean, save: boolean): this {
    if (isEqual && this.some(item => lodash.isEqual(item, element))) {
      return this
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
      elements = elements.filter(element => !this.some(item => lodash.isEqual(item, element)))

      if (elements.length === 0) {
        return this
      }
    }

    this.push(...elements)
    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)

    return this
  }

  /**
   * @param save 是否立即保存
   */
  remove (predicate: T | ((item: T) => boolean), save: boolean, isIndex: boolean = false): this {
    let newArr: T[] = []

    if (isIndex && lodash.isNumber(predicate)) {
      if (predicate < 0 || predicate >= this.length) {
        logger.error(`索引 ${predicate} 超出范围`)
        return this
      }
      newArr = [...this.slice(0, predicate), ...this.slice(predicate + 1)]
    } else if (lodash.isFunction(predicate)) {
      newArr = this.filter(item => !predicate(item))
    } else {
      newArr = lodash.without(this, predicate)
    }

    // 清空当前数组并添加新元素
    this.length = 0
    this.push(...newArr)

    this.#cfg.set<T[]>(this.#keyPath, this.slice(), save)

    return this
  }

  clear () {
    this.length = 0
    return this
  }
}
