import { dir } from '@/dir'
import { BaseImageType, CardbgImageType, EquipImageType, EquipPropType, EquipSuitType, EquipTiaolvType, FashionLevelImageType, ImageMapType, MenpaiImageType, QishuImageType, WuxueImageType, XinfaImageType } from '@/types/core/resources'
import { downFile, existsSync, existToMkdirSync, logger, redis, writeJsonSync } from 'node-karin'
import axios from 'node-karin/axios'
import path from 'node:path'
import { decode } from './decoe'
import { Equip } from './equip'
import { Qishu } from './qishu'
import { Wuxue } from './wuxue'
import { Xinfa } from './xinfa'

/** @description 是否首次加载 */
let First = true

export const ResourcesUpdate = new class {
  #ResourcesMap = new Map<string, (first: boolean) => Promise<void>>()

  constructor () {
    /** @description 头像 */
    this.#ResourcesMap.set('avatar', async () => {
      const avatarData: { data: string } = (await axios.get('https://www.yysls.cn/res/config/data/head_s.json')).data
      const headDataDecode = decode<Record<string, BaseImageType>>('头像', avatarData.data)
      this.save('avatar', Object.values(headDataDecode || {}))

      headDataDecode && await this.download('avatar', Object.values(headDataDecode).map(AvatarImage => (
        { id: String(AvatarImage.id), image: AvatarImage.pic_url }
      )))
    })

    /** @description 奇术 */
    this.#ResourcesMap.set('qishu', async (first) => {
      const qishuData: string = (await axios.get('https://www.yysls.cn/res/config/data/qishu.txt')).data
      const qishuDataDecode = decode<Record<string, QishuImageType>>('奇术', qishuData)
      this.save('qishu', Object.values(qishuDataDecode || {})) && first && Qishu.load().watch()

      qishuDataDecode && await this.download('qishu', Object.values(qishuDataDecode).map(QishuImage => (
        { id: String(QishuImage.id), name: QishuImage.name, image: QishuImage.pic_url }
      )))
    })

    /** @description 装备 */
    this.#ResourcesMap.set('equip', async (first) => {
      const equipData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip.txt')).data
      const equipDataDecode = decode<Record<string, EquipImageType>>('装备', equipData)
      this.save('equip', Object.values(equipDataDecode || {})) && first && Equip.load().watch()

      equipDataDecode && await this.download('equip', Object.values(equipDataDecode).map(EquipImage => (
        { id: String(EquipImage.id), name: EquipImage.name, image: EquipImage.icon_url, icon: EquipImage.long_icon_url }
      )))
    })

    /** @description 装备调率 */
    this.#ResourcesMap.set('equip_tiaolv', async (first) => {
      const equipTiaolvData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip_tiaolv.txt')).data
      const equipTiaolvDataDecode = decode<Record<string, EquipTiaolvType>>('装备调律', equipTiaolvData)
      this.save('equip', Object.values(equipTiaolvDataDecode || {}), 'tiaolv_list.json') && first && Equip.loadTiaolv().watch()
    })

    /** @description 装备定音 */
    this.#ResourcesMap.set('equip_dingyin', async (first) => {
      const equipDingYinData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip_dingyin.txt')).data
      const equipDingYinDataDecode = decode<Record<string, EquipTiaolvType>>('装备定音', equipDingYinData)
      this.save('equip', Object.values(equipDingYinDataDecode || {}), 'dingyin_list.json') && first && Equip.loadDingYin().watch()
    })

    /** @description 装备词条 */
    this.#ResourcesMap.set('equip_prop', async (first) => {
      const equipPropData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip_prop.txt')).data
      const equipPropDataDecode = decode<Record<string, EquipPropType>>('装备词条', equipPropData)
      this.save('equip', Object.values(equipPropDataDecode || {}), 'prop_list.json') && first && Equip.loadProp().watch()
    })

    /** @description 装备套装 */
    this.#ResourcesMap.set('equip_suit', async (first) => {
      const equipSuitData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip_suit.txt')).data
      const equipSuitDataDecode = decode<Record<string, EquipSuitType>>('装备套装', equipSuitData)
      this.save('equip', Object.values(equipSuitDataDecode || {}), 'suit_list.json') && first && Equip.loadSuit().watch()
    })

    /** @description 门派 */
    this.#ResourcesMap.set('menpai', async () => {
      const menpaiData: string = (await axios.get('https://www.yysls.cn/res/config/data/base_school.txt')).data
      const menpaiDataDecode = decode<Record<string, MenpaiImageType>>('门派', menpaiData)
      this.save('menpai', Object.values(menpaiDataDecode || {}))

      menpaiDataDecode && await this.download('menpai', Object.values(menpaiDataDecode).map(MenpaiImage => (
        { id: String(MenpaiImage.id), image: MenpaiImage.menpai_name_pic_url, icon: MenpaiImage.menpai_pic_url }
      )))
    })

    /** @description 背景图 */
    this.#ResourcesMap.set('cardbg', async () => {
      const cardbgData: string = (await axios.get('https://www.yysls.cn/res/config/data/name_card_bg.txt')).data
      const cardbgDataDecode = decode<Record<string, CardbgImageType>>('背景图', cardbgData)
      this.save('cardbg', Object.values(cardbgDataDecode || {}))

      cardbgDataDecode && await this.download('cardbg', Object.values(cardbgDataDecode).map(CardbgImage => (
        { id: String(CardbgImage.id), image: CardbgImage.pic_url }
      )))
    })

    /** @description 武学 */
    this.#ResourcesMap.set('wuxue', async (first) => {
      const wuxueData: string = (await axios.get('https://www.yysls.cn/res/config/data/kongfu.txt')).data
      const wuxueDataDecode = decode<Record<string, WuxueImageType>>('武学', wuxueData)
      this.save('wuxue', Object.values(wuxueDataDecode || {})) && first && Wuxue.load().watch()

      wuxueDataDecode && await this.download('wuxue', Object.values(wuxueDataDecode).map(WuxueImage => (
        { id: String(WuxueImage.id), name: WuxueImage.name, image: WuxueImage.pic_url }
      )))
    })

    /** @description 心法 */
    this.#ResourcesMap.set('xinfa', async (first) => {
      const xinfaData: string = (await axios.get('https://www.yysls.cn/res/config/data/xinfa.txt')).data
      const xinfaDataDecode = decode<Record<string, XinfaImageType>>('心法', xinfaData)
      this.save('xinfa', Object.values(xinfaDataDecode || {})) && first && Xinfa.load().watch()

      xinfaDataDecode && await this.download('xinfa', Object.values(xinfaDataDecode).map(XinfaImage => (
        { id: String(XinfaImage.id), name: XinfaImage.name, image: XinfaImage.icon_url }
      )))
    })

    /** @description 风华 */
    this.#ResourcesMap.set('fashion', async () => {
      const fashionLevelData: string = (await axios.get('https://www.yysls.cn/res/config/data/fashion_level.txt')).data
      const fashionLevelDataDecode = decode<FashionLevelImageType[]>('风华', fashionLevelData)
      this.save('fashion', fashionLevelDataDecode || [])

      fashionLevelDataDecode && await this.download('fashion', fashionLevelDataDecode.map(FashionLevelImage => (
        { id: String(FashionLevelImage.id), image: FashionLevelImage.icon_url }
      )))
    })
  }

  /**
   * @param force 是否强制检查更新
   */
  async check (force = false) {
    logger.info(`[${dir.name}] 检查更新图片资源...`)

    this.#ResourcesMap.forEach(async (handler, key) => {
      const redisKey = `${dir.name}:resourcesUpdate:${key}`
      if (!force && await redis.get(redisKey)) return true

      await handler(First)

      await redis.setEx(redisKey, 3600 * 8, '1')

      return true
    })

    First = false
  }

  async download (name: string, ImageMap: ImageMapType[]) {
    return await Promise.all(ImageMap.map(async ({ id, image, icon, bg }) => {
      const imagePath = path.join(dir.ResourcesDir, 'images', name, `${id}.png`)
      image && !existsSync(imagePath) && await downFile(image, imagePath)

      const iconPath = path.join(dir.ResourcesDir, 'images', name, `${id}_icon.png`)
      icon && !existsSync(iconPath) && await downFile(icon, iconPath)

      const bgPath = path.join(dir.ResourcesDir, 'images', name, `${id}_bg.png`)
      bg && !existsSync(bgPath) && await downFile(bg, bgPath)
    }))
  }

  save<T> (name: string, ImageMap: T[], file: string = 'list.json'): boolean {
    existToMkdirSync(path.join(dir.ResourcesDir, 'images', name))

    writeJsonSync(path.join(dir.ResourcesDir, 'images', name, file), ImageMap)

    return true
  }
}()
