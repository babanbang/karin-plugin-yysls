import { ResourcesUpdate } from '@/core/resources'
import { logger } from 'node-karin'
import { dir } from './dir'

/** 请不要在这编写插件 不会有任何效果~ */
logger.info(`${logger.violet(`[插件:${dir.version}]`)} ${logger.green(dir.name)} 初始化完成~`)

/** 检查并下载缺失的图片资源 */
await ResourcesUpdate.check()
