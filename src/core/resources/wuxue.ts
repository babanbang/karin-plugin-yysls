import { dir } from '@/dir'
import { ImageMapType, WuxueItem } from '@/types'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

const liupaiMap = new Map([
  ['10000', ''], ['10206', ''],
  ['10103', ''], ['10205', ''], ['10101', '影'], ['10201', '影'], ['10102', '虹'], ['10202', '虹'],
  ['10305', ''], ['20600', ''], ['10301', '霖'], ['20602', '霖'], ['10302', '玉'], ['20601', '玉'],
  ['20400', ''], ['20401', '威'], ['20103', '威'], ['20402', '钧'], ['20801', '钧'],
  ['20500', ''], ['20700', ''], ['20501', '风'], ['20701', '风'], ['20603', '尘'], ['20702', '尘']
])

let First = true

export const Wuxue = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'wuxue', 'list.json')
  #map = new Map<string, WuxueItem>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('武学资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const wuxueData: ImageMapType[] = readJsonSync(this.listPath) || []
    this.#map.clear()

    wuxueData.forEach(item => {
      const liupai = liupaiMap.get(item.id)
      if (!liupai) {
        logger.error(`武学(liupaiMap:${item.id})需要更新，请提交issue`)
      }

      this.#map.set(item.id, {
        id: item.id,
        name: item.name!,
        image: `images/wuxue/${item.id}.png`,
        liupai,
        liupai_icon: `image/liupai/${liupai}.png`
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

  get (_id: string, level: number): WuxueItem & { level: number } {
    First && this.load()

    const id = String(_id)

    const wuxue = this.#map.get(id)
    if (!wuxue) {
      logger.error(`武学资源未更新：[${id}] underfined`)

      return { id, name: '未知武学', image: '', liupai_icon: '', level }
    }

    return { ...wuxue, level }
  }
}()
