import { karinPathBase, requireFileSync } from 'node-karin'
import path from 'node:path'
import { URL, fileURLToPath } from 'node:url'

/** 插件包绝对路径 */
const pluginDir = fileURLToPath(new URL('../', import.meta.url))
/** 插件包目录名称 */
const pluginName = path.basename(pluginDir)
/** package.json */
const pkg = requireFileSync(path.join(pluginDir, 'package.json'))

/**
 * 插件目录信息
 */
export const dir = {
  /** @description 根目录绝对路径 */
  pluginDir,
  /** @description 插件目录名称 */
  pluginName,
  /** @description package.json */
  pkg,
  /** @description 插件版本 package.json 的 version */
  get version () {
    return pkg.version
  },
  /** @description 插件名称 package.json 的 name */
  get name () {
    return pkg.name
  },
  /** @description 在`@karinjs`中的绝对路径 */
  get karinPath () {
    return path.join(karinPathBase, pluginName)
  },
  /** @description 插件数据目录 `@karinjs/karin-plugin-xxx/data` */
  get DataDir () {
    return path.join(this.karinPath, 'data')
  },
  /** @description 插件配置目录 `@karinjs/karin-plugin-xxx/config` */
  get ConfigDir () {
    return path.join(this.karinPath, 'config')
  },
  /** @description 插件资源目录 `@karinjs/karin-plugin-xxx/resources` */
  get ResourcesDir () {
    return path.join(this.karinPath, 'resources')
  },
}
