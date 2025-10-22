import { dir } from '@/dir'
import { EquipItem, ImageMapType } from '@/types/core/resources'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

let First = true

export const Equip = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'equip', 'list.json')
  #map = new Map<string, EquipItem>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('装备资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const equipData: ImageMapType[] = readJsonSync(this.listPath) || []
    this.#map.clear()

    equipData.forEach(item => {
      this.#map.set(item.id, {
        id: item.id,
        name: item.name!,
        image: `${dir.ResourcesDir}/images/equip/${item.id}.png`,
        long_icon: `${dir.ResourcesDir}/images/equip/${item.id}_icon.png`
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

  get (_id: string): EquipItem {
    First && this.load()

    const id = String(_id)

    const equip = this.#map.get(id)
    if (!equip) {
      logger.error(`武器资源未更新：[${id}] underfined`)

      return { id, name: '未知装备', image: '', long_icon: '' }
    }

    return equip
  }
}()
