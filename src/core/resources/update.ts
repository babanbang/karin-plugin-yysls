import { dir } from '@/dir'
import { BaseImage, CardbgImage, EquipImage, FashionLevelImage, ImageMapType, MenpaiImage, QishuImage, WuxueImage, XinfaImage } from '@/types/core/resources'
import { downFile, existsSync, existToMkdirSync, logger, redis, writeJsonSync } from 'node-karin'
import axios from 'node-karin/axios'
import path from 'node:path'
import { decode } from './decoe'

export const ResourcesUpdate = new class {
  /**
   * @param force 是否强制检查更新
   */
  async check (force = false) {
    logger.info(`[${dir.name}] 检查更新图片资源...`)

    for (const key of ['avatar', 'qishu', 'equip', 'menpai', 'cardbg', 'wuxue', 'xinfa', 'fashion']) {
      (async () => {
        const redisKey = `${dir.name}:resourcesUpdate:${key}`
        if (!force && await redis.get(redisKey)) { return true }

        await (this as any)[key](key, force)

        await redis.setEx(redisKey, 3600 * 8, '1')

        return true
      })()
    }
  }

  /** @description 头像 */
  async avatar (key: string) {
    const avatarData: { data: string } = (await axios.get('https://www.yysls.cn/res/config/data/head_s.json')).data
    const headDataDecode = decode<Record<string, BaseImage>>('头像', avatarData.data)
    headDataDecode && await this.download(key, Object.values(headDataDecode).map(AvatarImage => (
      { id: String(AvatarImage.id), image: AvatarImage.pic_url, icon: '' }
    )), true)
  }

  /** @description 奇术 */
  async qishu (key: string) {
    const qishuData: string = (await axios.get('https://www.yysls.cn/res/config/data/qishu.txt')).data
    const qishuDataDecode = decode<Record<string, QishuImage>>('奇术', qishuData)
    qishuDataDecode && await this.download(key, Object.values(qishuDataDecode).map(QishuImage => (
      { id: String(QishuImage.id), name: QishuImage.name, image: QishuImage.pic_url, icon: '' }
    )), true)
  }

  /** @description 装备 */
  async equip (key: string) {
    const equipData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip.txt')).data
    const equipDataDecode = decode<Record<string, EquipImage>>('装备', equipData)
    equipDataDecode && await this.download(key, Object.values(equipDataDecode).map(EquipImage => (
      { id: String(EquipImage.id), name: EquipImage.name, image: EquipImage.icon_url, icon: EquipImage.long_icon_url }
    )), true)
  }

  /** @description 门派 */
  async menpai (key: string) {
    const menpaiData: string = (await axios.get('https://www.yysls.cn/res/config/data/base_school.txt')).data
    const menpaiDataDecode = decode<Record<string, MenpaiImage>>('门派', menpaiData)
    menpaiDataDecode && await this.download(key, Object.values(menpaiDataDecode).map(MenpaiImage => (
      { id: String(MenpaiImage.id), image: MenpaiImage.menpai_name_pic_url, icon: MenpaiImage.menpai_pic_url }
    )), true)
  }

  /** @description 背景图 */
  async cardbg (key: string) {
    const cardbgData: string = (await axios.get('https://www.yysls.cn/res/config/data/name_card_bg.txt')).data
    const cardbgDataDecode = decode<Record<string, CardbgImage>>('背景图', cardbgData)
    cardbgDataDecode && await this.download(key, Object.values(cardbgDataDecode).map(CardbgImage => (
      { id: String(CardbgImage.id), image: CardbgImage.pic_url, icon: '' }
    )), true)
  }

  /** @description 武学 */
  async wuxue (key: string) {
    const wuxueData: string = (await axios.get('https://www.yysls.cn/res/config/data/kongfu.txt')).data
    const wuxueDataDecode = decode<Record<string, WuxueImage>>('武学', wuxueData)
    wuxueDataDecode && await this.download(key, Object.values(wuxueDataDecode).map(WuxueImage => (
      { id: String(WuxueImage.id), name: WuxueImage.name, image: WuxueImage.pic_url, icon: WuxueImage.liupai_pic_url }
    )), true, { icon: true })
  }

  /** @description 心法 */
  async xinfa (key: string) {
    const xinfaData: string = (await axios.get('https://www.yysls.cn/res/config/data/xinfa.txt')).data
    const xinfaDataDecode = decode<Record<string, XinfaImage>>('武学', xinfaData)
    xinfaDataDecode && await this.download(key, Object.values(xinfaDataDecode).map(XinfaImage => (
      { id: String(XinfaImage.id), name: XinfaImage.name, image: XinfaImage.icon_url, icon: XinfaImage.liupai_pic_big_url, bg: XinfaImage.bg_icon_url }
    )), true, { icon: true, bg: true })
  }

  /** @description 风华 */
  async fashion (key: string) {
    const fashionLevelData: string = (await axios.get('https://www.yysls.cn/res/config/data/fashion_level.txt')).data
    const fashionLevelDataDecode = decode<FashionLevelImage[]>('风华', fashionLevelData)
    fashionLevelDataDecode && await this.download(key, fashionLevelDataDecode.map(FashionLevelImage => (
      { id: String(FashionLevelImage.id), image: FashionLevelImage.icon_url, icon: '' }
    )), true)
  }

  async download (name: string, ImageMap: ImageMapType[], saveList: boolean, ignore: { icon?: boolean, bg?: boolean } = {}) {
    existToMkdirSync(path.join(dir.ResourcesDir, 'images', name))

    saveList && writeJsonSync(path.join(dir.ResourcesDir, 'images', name, 'list.json'), ImageMap)

    Promise.all(ImageMap.map(async ({ id, image, icon, bg }) => {
      const imagePath = path.join(dir.ResourcesDir, 'images', name, `${id}.png`)
      if (image && !existsSync(imagePath)) {
        await downFile(image, imagePath)
      }

      const iconPath = path.join(dir.ResourcesDir, 'images', name, `${id}_icon.png`)
      if (!ignore.icon && icon && !existsSync(iconPath)) {
        await downFile(icon, iconPath)
      }

      const bgPath = path.join(dir.ResourcesDir, 'images', name, `${id}_bg.png`)
      if (!ignore.bg && bg && !existsSync(bgPath)) {
        await downFile(bg, bgPath)
      }
    }))
  }
}()
