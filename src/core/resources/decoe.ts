import { logger } from 'node-karin'

const DEFAULT_CHUNK_SIZE = 99

export const decode = <T> (name: string, obfuscated: string, chunkSize = DEFAULT_CHUNK_SIZE): T | undefined => {
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
