import { dir } from '@/dir'
import { ImageMapType, QishuItem } from '@/types/core/resources'
import { logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

export const Qishu = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'qishu', 'list.json')
  #map = new Map<string, QishuItem>()

  load () {
    const equipData: ImageMapType[] = readJsonSync(this.listPath)
    this.#map.clear()

    equipData.forEach(item => {
      this.#map.set(item.id, {
        id: item.id,
        name: item.name!,
        image: `${dir.ResourcesDir}/images/qishu/${item.id}.png`
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

  get (_id: string, level: number): QishuItem & { level: number } {
    const id = String(_id)

    const qishu = this.#map.get(id)
    if (!qishu) {
      logger.error(`奇术资源未更新：[${id}] underfined`)

      return { id, name: '未知奇术', image: '', level }
    }

    return { ...qishu, level }
  }
}()
