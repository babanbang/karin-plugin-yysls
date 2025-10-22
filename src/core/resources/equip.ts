import { dir } from '@/dir'
import { EquipItem, ImageMapType } from '@/types/core/resources'
import { logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

export const Equip = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'equip', 'list.json')
  #map = new Map<string, EquipItem>()

  constructor () {
    this.load()

    watch(this.listPath, () => {
      this.load()
    })
  }

  load () {
    const equipData: ImageMapType[] = readJsonSync(this.listPath)
    this.#map.clear()

    equipData.forEach(item => {
      this.#map.set(item.id, {
        id: item.id,
        name: item.name!,
        image: `${dir.ResourcesDir}/images/equip/${item.id}.png`,
        long_icon: `${dir.ResourcesDir}/images/equip/${item.id}_icon.png`
      })
    })
  }

  get (_id: string): EquipItem {
    const id = String(_id)

    const equip = this.#map.get(id)
    if (!equip) {
      logger.error(`武器资源未更新：[${id}] underfined`)

      return { id, name: '未知装备', image: '', long_icon: '' }
    }

    return equip
  }
}()
