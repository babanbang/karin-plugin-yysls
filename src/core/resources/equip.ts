import { dir } from '@/dir'
import { EquipImageType, EquipItem, EquipPropItem, EquipPropType, EquipSuitType, EquipTiaolvItem, EquipTiaolvType } from '@/types/core/resources'
import { Format } from '@/utils'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'
import { EquipTiaolvInfoType } from '../api'

let First = true
let TiaolvFirst = true
let DingYinFirst = true
let PropFirst = true
let SuitFirst = true

const TiaolvLevel = ['绿', '蓝', '紫', '金']
export const Equip = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'equip', 'list.json')
  tiaolvListPath = path.join(dir.ResourcesDir, 'images', 'equip', 'tiaolv_list.json')
  dingyinListPath = path.join(dir.ResourcesDir, 'images', 'equip', 'dingyin_list.json')
  propListPath = path.join(dir.ResourcesDir, 'images', 'equip', 'prop_list.json')
  suitListPath = path.join(dir.ResourcesDir, 'images', 'equip', 'suit_list.json')

  #equipMap = new Map<number, EquipItem>()
  #equipTiaolvMap = new Map<number, EquipTiaolvType>()
  #equipDingYinMap = new Map<number, EquipTiaolvType>()
  #equipPropMap = new Map<string, EquipPropType>()
  #equipSuitMap = new Map<number, EquipSuitType>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('装备资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const equipData: EquipImageType[] = readJsonSync(this.listPath) || []
    this.#equipMap.clear()

    equipData.forEach(item => {
      const id = Number(item.id)

      this.#equipMap.set(id, {
        id,
        name: item.name,
        quality: item.star,
        image: `images/equip/${id}.png`,
        long_icon: `images/equip/${id}_icon.png`
      })
    })

    return {
      watch: () => {
        watch(this.listPath, () => {
          this.load()
        })
      }
    }
  }

  loadTiaolv () {
    if (!existsSync(this.tiaolvListPath)) {
      logger.error('装备调律资源未更新：tiaolv_list.json 文件不存在')
    } else {
      TiaolvFirst = false
    }

    const equipTiaolvData: EquipTiaolvType[] = readJsonSync(this.tiaolvListPath) || []
    this.#equipTiaolvMap.clear()

    equipTiaolvData.forEach(item => {
      const id = Number(item.id)

      this.#equipTiaolvMap.set(id, { ...item, id })
    })

    return {
      watch: () => {
        watch(this.tiaolvListPath, () => {
          this.loadTiaolv()
        })
      }
    }
  }

  loadDingYin () {
    if (!existsSync(this.dingyinListPath)) {
      logger.error('装备定音资源未更新：dingyin_list.json 文件不存在')
    } else {
      DingYinFirst = false
    }

    const equipDingYinData: EquipTiaolvType[] = readJsonSync(this.dingyinListPath) || []
    this.#equipDingYinMap.clear()

    equipDingYinData.forEach(item => {
      const id = Number(item.id)
      this.#equipDingYinMap.set(id, { ...item, id })
    })

    return {
      watch: () => {
        watch(this.dingyinListPath, () => {
          this.loadDingYin()
        })
      }
    }
  }

  loadProp () {
    if (!existsSync(this.propListPath)) {
      logger.error('装备词条资源未更新：prop_list.json 文件不存在')
    } else {
      PropFirst = false
    }

    const equipPropData: EquipPropType[] = readJsonSync(this.propListPath) || []
    this.#equipPropMap.clear()

    equipPropData.forEach(item => {
      this.#equipPropMap.set(String(item.id), item)
      this.#equipPropMap.set(item.prop_name_en, item)
    })

    return {
      watch: () => {
        watch(this.propListPath, () => {
          this.loadProp()
        })
      }
    }
  }

  loadSuit () {
    if (!existsSync(this.suitListPath)) {
      logger.error('装备套装资源未更新：suit_list.json 文件不存在')
    } else {
      SuitFirst = false
    }

    const equipSuitData: EquipSuitType[] = readJsonSync(this.suitListPath) || []
    this.#equipSuitMap.clear()

    equipSuitData.forEach(item => {
      const id = Number(item.id)

      this.#equipSuitMap.set(id, { ...item, id })
    })

    return {
      watch: () => {
        watch(this.suitListPath, () => {
          this.loadSuit()
        })
      }
    }
  }

  get (_id: number): EquipItem {
    First && this.load()
    const id = Number(_id)

    const equip = this.#equipMap.get(id)
    if (!equip) {
      logger.error(`武器资源未更新：[${id}] underfined`)

      return { id, name: '未知装备', quality: 2, image: '', long_icon: '' }
    }

    return equip
  }

  tiaolvFn (cfg: EquipTiaolvType, tiaolv: EquipTiaolvInfoType): EquipTiaolvItem {
    return {
      ...cfg,
      data: {
        type: TiaolvLevel[tiaolv[3]],
        percent: +(tiaolv[2] * 100).toFixed(2),
        recommend: tiaolv[4],
        label: Format(cfg.affix_des, [tiaolv[0]]),
        value: cfg.value_show_form ? Format(cfg.value_show_form, [tiaolv[1]]) : ''
      }
    }
  }

  getTiaolv (tiaolv: EquipTiaolvInfoType): EquipTiaolvItem {
    TiaolvFirst && this.loadTiaolv()
    const id = Number(tiaolv[0])

    const equipTiaolv = this.#equipTiaolvMap.get(id)
    if (!equipTiaolv) {
      const equipDingYin = this.getDingYin(id, tiaolv)
      if (equipDingYin) return equipDingYin

      logger.error(`武器调律定音资源未更新：[${id}] underfined`)

      return this.tiaolvFn({ id, affix_des: '未知调率', value_show_form: '{0:.1f}' }, tiaolv)
    }

    return this.tiaolvFn(equipTiaolv, tiaolv)
  }

  getDingYin (_id: number, dinyin: EquipTiaolvInfoType): EquipTiaolvItem | undefined {
    DingYinFirst && this.loadDingYin()
    const id = Number(_id)

    const equipDingYin = this.#equipDingYinMap.get(id)
    if (!equipDingYin) return undefined

    return this.tiaolvFn(equipDingYin, dinyin)
  }

  propFn (cfg: EquipPropType, num: number): EquipPropItem {
    return {
      ...cfg,
      data: {
        label: cfg.prop_name_cn,
        value: Format(cfg.show_class_attrs_form || '{}', [num])
      }
    }
  }

  getProp (_id: string, num: number): EquipPropItem {
    PropFirst && this.loadProp()
    const id = String(_id)

    const equipProp = this.#equipPropMap.get(id)
    if (!equipProp) {
      logger.error(`武器词条资源未更新：[${id}] underfined`)

      return this.propFn({ id: 0, prop_name_cn: '未知词条', prop_name_en: 'unknown' }, num)
    }

    return this.propFn(equipProp, num)
  }

  getSuit (_id: number): EquipSuitType {
    SuitFirst && this.loadSuit()
    const id = Number(_id)

    const equipSuit = this.#equipSuitMap.get(id)
    if (!equipSuit) {
      logger.error(`武器套装资源未更新：[${id}] underfined`)
      return { id, name: '未知套装', short: '未知' }
    }

    return equipSuit
  }
}()
