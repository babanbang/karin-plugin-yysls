import { dir } from '@/dir'
import { QishuImageType, QishuItem } from '@/types/core/resources'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

let First = true
export const Qishu = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'qishu', 'list.json')
  #map = new Map<number, QishuItem>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('奇术资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const equipData: QishuImageType[] = readJsonSync(this.listPath) || []
    this.#map.clear()

    equipData.forEach(item => {
      const id = Number(item.id)

      this.#map.set(id, {
        id,
        name: item.name!,
        image: `images/qishu/${id}.png`
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

  get (_id: number, level: number): QishuItem & { level: number } {
    First && this.load()
    const id = Number(_id)

    const qishu = this.#map.get(id)
    if (!qishu) {
      logger.error(`奇术资源未更新：[${id}] underfined`)

      return { id, name: '未知奇术', image: '', level }
    }

    return { ...qishu, level }
  }
}()
