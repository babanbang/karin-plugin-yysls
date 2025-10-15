import { dir } from '@/dir'
import { BaseImage, CardbgImage, EquipImage, FashionLevelImage, ImageMapType, MenpaiImage, QishuImage, WuxueImage } from '@/types/core/resources'
import { downFile, existsSync, existToMkdirSync, logger, redis, writeJsonSync } from 'node-karin'
import axios from 'node-karin/axios'
import path from 'node:path'

const DEFAULT_CHUNK_SIZE = 99

export const ResourcesUpdate = new class {
  /**
   * @param force 是否强制检查更新
   */
  async check (force = false) {
    if (!force && await redis.get(dir.name + ':resourcesUpdate')) return true

    logger.info(`[${dir.name}] 检查更新图片资源...`)

    await this.avatar()

    await this.qishu()

    await this.equip()

    await this.menpai()

    await this.cardbg()

    await this.wuxue()

    await this.fashion()

    await redis.setEx(dir.name + ':resourcesUpdate', 3600 * 8, '1')
  }

  /** @description 头像 */
  async avatar () {
    const avatarData: { data: string } = (await axios.get('https://www.yysls.cn/res/config/data/head_s.json')).data
    const headDataDecode = this.decode<Record<string, BaseImage>>('头像', avatarData.data)
    headDataDecode && this.download('avatar', Object.values(headDataDecode).map(AvatarImag => (
      { id: String(AvatarImag.id), image: AvatarImag.pic_url, icon: '' }
    )), true)
  }

  /** @description 奇术 */
  async qishu () {
    const qishuData: string = (await axios.get('https://www.yysls.cn/res/config/data/qishu.txt')).data
    const qishuDataDecode = this.decode<Record<string, QishuImage>>('奇术', qishuData)
    qishuDataDecode && this.download('qishu', Object.values(qishuDataDecode).map(QishuImag => (
      { id: String(QishuImag.id), image: QishuImag.pic_url, icon: '' }
    )), true)
  }

  /** @description 装备 */
  async equip () {
    const equipData: string = (await axios.get('https://www.yysls.cn/res/config/data/equip.txt')).data
    const equipDataDecode = this.decode<Record<string, EquipImage>>('装备', equipData)
    equipDataDecode && this.download('equip', Object.values(equipDataDecode).map(EquipImag => (
      { id: String(EquipImag.id), image: EquipImag.icon_url, icon: '' }
    )), true)
  }

  /** @description 门派 */
  async menpai () {
    const menpaiData: string = (await axios.get('https://www.yysls.cn/res/config/data/base_school.txt')).data
    const menpaiDataDecode = this.decode<Record<string, MenpaiImage>>('门派', menpaiData)
    menpaiDataDecode && this.download('menpai', Object.values(menpaiDataDecode).map(MenpaiImag => (
      { id: String(MenpaiImag.id), image: MenpaiImag.menpai_name_pic_url, icon: MenpaiImag.menpai_pic_url }
    )), true)
  }

  /** @description 背景图 */
  async cardbg () {
    const cardbgData: string = (await axios.get('https://www.yysls.cn/res/config/data/name_card_bg.txt')).data
    const cardbgDataDecode = this.decode<Record<string, CardbgImage>>('背景图', cardbgData)
    cardbgDataDecode && this.download('cardbg', Object.values(cardbgDataDecode).map(CardbgImag => (
      { id: String(CardbgImag.id), image: CardbgImag.pic_url, icon: '' }
    )), true)
  }

  /** @description 武学 */
  async wuxue () {
    const wuxueData: string = (await axios.get('https://www.yysls.cn/res/config/data/kongfu.txt')).data
    const wuxueDataDecode = this.decode<Record<string, WuxueImage>>('武学', wuxueData)
    wuxueDataDecode && this.download('wuxue', Object.values(wuxueDataDecode).map(WuxueImag => (
      { id: String(WuxueImag.id), image: WuxueImag.pic_url, icon: '' }
    )), true)
  }

  /** @description 风华 */
  async fashion () {
    const fashionLevelData: string = (await axios.get('https://www.yysls.cn/res/config/data/fashion_level.txt')).data
    const fashionLevelDataDecode = this.decode<FashionLevelImage[]>('风华', fashionLevelData)
    fashionLevelDataDecode && this.download('fashion', fashionLevelDataDecode.map(FashionLevelImag => (
      { id: String(FashionLevelImag.id), image: FashionLevelImag.icon_url, icon: '' }
    )), true)
  }

  async download (name: string, ImageMap: ImageMapType[], saveList: boolean) {
    existToMkdirSync(path.join(dir.ResourcesDir, 'images', name))

    saveList && writeJsonSync(path.join(dir.ResourcesDir, 'images', name, 'list.json'), ImageMap)

    ImageMap.map(async ({ id, image, icon }) => {
      const imagePath = path.join(dir.ResourcesDir, 'images', name, `${id}.png`)
      if (image && !existsSync(imagePath)) {
        downFile(image, imagePath)
      }

      const iconPath = path.join(dir.ResourcesDir, 'images', name, `${id}_icon.png`)
      if (icon && !existsSync(iconPath)) {
        downFile(icon, iconPath)
      }
    })
  }

  decode<T> (name: string, obfuscated: string, chunkSize = DEFAULT_CHUNK_SIZE): T | undefined {
    if (!obfuscated || typeof obfuscated !== 'string') {
      logger.error(`解析 ${name} 图片资源失败。`)

      return undefined
    }

    // 原算法会把分块 + 随机字母拼接后整体 reverse，这里先恢复顺序
    const reversed = [...obfuscated].reverse().join('')
    let base64Payload = ''

    for (let offset = 0; offset < reversed.length; offset += chunkSize + 1) {
      let fragment = reversed.substring(offset, offset + chunkSize)

      // 最后一段长度不足 chunkSize，会额外带上随机字符，需要去掉
      if (fragment.length < chunkSize && fragment.length > 0) {
        fragment = fragment.substring(0, fragment.length - 1)
      }

      base64Payload += fragment
    }

    const decoded = Buffer.from(base64Payload, 'base64').toString('utf8')

    return JSON.parse(decoded)
  }
}()
