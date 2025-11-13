/**
 * 格式化规范接口
 */
interface FormatSpec {
  /** 精度 */
  precision?: number
  /** 类型：d整数、f浮点、%百分比 */
  type?: string
}

/**
 * 解析格式化规范
 * @param spec 格式化规范字符串，如 ".1%"、".2f"、"d"
 * @returns 解析后的格式化规范对象
 */
function parseFormatSpec (spec: string): FormatSpec {
  const result: FormatSpec = {}

  if (!spec) return result

  // 解析精度：以 . 开头
  const precisionMatch = spec.match(/\.(\d+)/)
  if (precisionMatch) {
    result.precision = parseInt(precisionMatch[1], 10)
  }

  // 解析类型：最后一个字符（如果是字母）
  const typeMatch = spec.match(/([a-z%])$/i)
  if (typeMatch) {
    result.type = typeMatch[1]
  }

  return result
}

/**
 * 格式化单个数字值
 * @param value 要格式化的值
 * @param spec 格式化规范
 * @returns 格式化后的字符串
 */
function formatValue (value: any, spec: FormatSpec): string {
  const num = Number(value)

  switch (spec.type || 'f') {
    case 'd':
    case 'i':
      // 整数
      return Math.trunc(num).toString()
    case 'f':
    case 'F': {
      // 浮点数
      return num.toFixed(spec.precision ?? 6)
    }
    case '%': {
      // 百分比
      return (num * 100).toFixed(spec.precision ?? 6) + '%'
    }
    default:
      return String(value)
  }
}

/**
 * 格式化字符串（Python 风格数字格式化）
 * @param template 模板字符串，如 "值为 {0:.1%}"
 * @param args 参数数组
 * @returns 格式化后的字符串
 */
export const Format = (template: string, args: any[]): string => {
  return template.replace(/\{(\d+)(?::([^}]*))?\}/g, (match, indexStr, formatSpec) => {
    const index = parseInt(indexStr, 10)

    if (index >= args.length) {
      return match // 索引超出范围，保持原样
    }

    const spec = parseFormatSpec(formatSpec || '')

    return formatValue(args[index], spec)
  })
}
