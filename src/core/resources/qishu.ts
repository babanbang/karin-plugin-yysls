import { dir } from '@/dir'
import { ImageMapType, QishuItem } from '@/types/core/resources'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

let First = true
export const Qishu = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'qishu', 'list.json')
  #map = new Map<string, QishuItem>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('奇术资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const equipData: ImageMapType[] = readJsonSync(this.listPath) || []
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
    First && this.load()

    const id = String(_id)

    const qishu = this.#map.get(id)
    if (!qishu) {
      logger.error(`奇术资源未更新：[${id}] underfined`)

      return { id, name: '未知奇术', image: '', level }
    }

    return { ...qishu, level }
  }
}()
