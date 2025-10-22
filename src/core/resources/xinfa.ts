import { dir } from '@/dir'
import { ImageMapType, XinfaItem } from '@/types'
import { existsSync, logger, readJsonSync, watch } from 'node-karin'
import path from 'node:path'

const bgMap = new Map([
  ['1', { bg: 1, liupai: '通' }], ['2', { bg: 1, liupai: '通' }], ['3', { bg: 1, liupai: '通' }], ['4', { bg: 1, liupai: '通' }],
  ['5', { bg: 1, liupai: '通' }], ['6', { bg: 1, liupai: '通' }], ['41', { bg: 2, liupai: '通' }], ['42', { bg: 2, liupai: '通' }],
  ['43', { bg: 2, liupai: '通' }], ['44', { bg: 2, liupai: '通' }], ['45', { bg: 2, liupai: '通' }], ['46', { bg: 2, liupai: '通' }],
  ['47', { bg: 2, liupai: '通' }], ['48', { bg: 2, liupai: '通' }], ['81', { bg: 3, liupai: '通' }], ['82', { bg: 3, liupai: '通' }],
  ['101', { bg: 2, liupai: '虹' }], ['102', { bg: 2, liupai: '虹' }], ['103', { bg: 2, liupai: '虹' }], ['104', { bg: 3, liupai: '虹' }],
  ['151', { bg: 2, liupai: '影' }], ['152', { bg: 2, liupai: '影' }], ['153', { bg: 2, liupai: '影' }], ['154', { bg: 3, liupai: '影' }],
  ['301', { bg: 2, liupai: '玉' }], ['302', { bg: 2, liupai: '玉' }], ['303', { bg: 2, liupai: '玉' }], ['304', { bg: 3, liupai: '玉' }],
  ['351', { bg: 3, liupai: '霖' }], ['352', { bg: 2, liupai: '霖' }], ['353', { bg: 2, liupai: '霖' }], ['354', { bg: 2, liupai: '霖' }],
  ['401', { bg: 3, liupai: '威' }], ['402', { bg: 2, liupai: '威' }], ['403', { bg: 2, liupai: '威' }], ['404', { bg: 2, liupai: '威' }],
  ['451', { bg: 3, liupai: '风' }], ['452', { bg: 2, liupai: '风' }], ['453', { bg: 2, liupai: '风' }], ['454', { bg: 2, liupai: '风' }],
  ['501', { bg: 3, liupai: '尘' }], ['502', { bg: 2, liupai: '尘' }], ['503', { bg: 2, liupai: '尘' }], ['504', { bg: 2, liupai: '尘' }],
  ['551', { bg: 3, liupai: '钧' }], ['552', { bg: 2, liupai: '钧' }], ['553', { bg: 2, liupai: '钧' }], ['554', { bg: 2, liupai: '钧' }]
])

let First = true

const resDir = path.join(dir.pluginDir, 'resources').replace(/\\/g, '/')
export const Xinfa = new class {
  listPath = path.join(dir.ResourcesDir, 'images', 'xinfa', 'list.json')
  #map = new Map<string, XinfaItem>()

  load () {
    if (!existsSync(this.listPath)) {
      logger.error('心法资源未更新：list.json 文件不存在')
    } else {
      First = false
    }

    const xinfaData: ImageMapType[] = readJsonSync(this.listPath) || []
    this.#map.clear()

    xinfaData.forEach(item => {
      const bg = bgMap.get(item.id)
      this.#map.set(item.id, {
        id: item.id,
        name: item.name!,
        image: `${dir.ResourcesDir}/images/xinfa/${item.id}.png`,
        bg_icon: bg?.bg ? `${resDir}/image/xinfa/${bg.bg}_bg.png` : item.bg!,
        liupai_icon: bg?.liupai ? `${resDir}/image/liupai/${bg.liupai}_big.png` : item.icon
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

  get (_id: string, rank: number): XinfaItem & { rank: number } {
    First && this.load()

    const id = String(_id)

    const xinfa = this.#map.get(id)
    if (!xinfa) {
      logger.error(`心法资源未更新：[${id}] underfined`)

      return { id, name: '未知心法', image: '', bg_icon: '', liupai_icon: '', rank }
    }

    return { ...xinfa, rank }
  }
}()
