import { Cfg, CommandCfg } from '@/core/config'
import { dir } from '@/dir'
import { Database, Dialect } from '@/module/database'
import { components, defineConfig } from 'node-karin'
import lodash from 'node-karin/lodash'
import { CommandDescription, CommandEnum } from './types'
import { CommandType } from './types/core/config'

type ConfigSaveEntry = { 'database-dialect': Dialect }

type CommandSaveEntry = Record<`group-${CommandEnum}-cmds`, string[]> &
  Record<`${CommandEnum}-enable`, boolean> &
  Record<`${CommandEnum}-default`, boolean> &
  Record<`${CommandEnum}-flags`, boolean>

export default defineConfig({
  /** 插件信息配置 */
  info: {
    id: dir.name,
    name: '腌鱼十六升',
    version: dir.version,
    description: dir.pkg.description,
    author: [
      {
        name: dir.pkg.author,
        avatar: 'https://github.com/babanbang.png'
      }
    ]
  },

  /** 动态渲染的组件 */
  components: () => [
    components.accordion.create('accordion-config-key', {
      label: '基础设置',
      children: [
        components.accordion.createItem('accordion-dialect-item-key', {
          title: '数据库配置',
          subtitle: '一般使用默认数据库即可满足需求',
          children: [
            components.radio.group('database-dialect', {
              label: '选择数据库（切换数据库并不会转移旧数据至新数据库）',
              orientation: 'horizontal',
              size: 'sm',
              value: Cfg.get<Dialect>('database.dialect'),
              defaultValue: Cfg.getDef<Dialect>('database.dialect'),
              radio: Database.details.map(({ dialect, desc }) => components.radio.create(`radio-${dialect}`, {
                label: dialect, value: dialect, description: desc
              }))
            })
          ]
        }),
      ],
    }),
    components.divider.horizontal('divider-command-key'),
    components.accordion.create('accordion-command-key', {
      label: '触发指令配置（正在开发中，重启生效）',
      children: Object.entries(CommandCfg.get<CommandType>('')).map(([key, value]) => {
        const cmdKey = key as CommandEnum

        return components.accordion.createItem(`accordion-command-${key}`, {
          title: CommandDescription[cmdKey],
          subtitle: `默认指令: ${CommandCfg.getDef<string[]>(`${key}.cmds`).join('、')}`,
          className: 'flex flex-wrap justify-center items-start',
          children: [
            components.input.group(`group-${key}-cmds`, {
              label: '触发指令',
              data: value.cmds,
              template: components.input.string(`template-${key}-cmds`, {
                label: '指令'
              })
            }),
            components.switch.create(`${key}-enable`, {
              defaultSelected: value.default,
              label: '启用该功能',
            }),
            components.switch.create(`${key}-default`, {
              defaultSelected: value.default,
              label: '强制保留默认指令',
              description: '开启后使用Web配置时无论如何都会保留默认指令',
            }),
            components.switch.create(`${key}-flags`, {
              defaultSelected: value.flags,
              label: '忽略大小写',
            }),
          ],
        })
      })
    }),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: {
    'accordion-config-key': ConfigSaveEntry[],
    'accordion-command-key': CommandSaveEntry[]
  }) => {
    try {
      lodash.forEach(config, (value1, key1) => {
        if (key1 === 'accordion-config-key') {
          value1.forEach(_children => {
            const children = _children as ConfigSaveEntry

            lodash.forEach(children, (value2, key2) => {
              Cfg.set(key2.replace(/-/g, '.'), value2, false)
            })
          })
        } else if (key1 === 'accordion-command-key') {
          value1.forEach(_children => {
            const children = _children as CommandSaveEntry

            const command = { key: '', cmds: [], enable: true, default: true, flags: true } as unknown as {
              key: CommandEnum, cmds: string[], enable: boolean, default: boolean, flags: boolean
            }

            lodash.forEach(children, (value2, key2) => {
              if (/^group-/.test(key2)) {
                const splitKey = key2.replace(/^group-/, '').split('-')

                command.key = splitKey[0] as CommandEnum
                command.cmds = value2 as string[]
              } else {
                const propKey = key2.replace(`${command.key}-`, '') as 'enable' | 'default' | 'flags'

                command[propKey] = value2 as boolean
                CommandCfg.set(`${command.key}.${propKey}`, command[propKey], false)
              }
            })

            const cmds = CommandCfg.get<string>(`${command.key}.cmds`, true)
            cmds.addSome(command.cmds, true, false)

            if (command.default) {
              const defCmds = CommandCfg.getDef<string[]>(`${command.key}.cmds`)
              cmds.addSome(defCmds, true, false)
            }
          })
        }
      })

      Cfg.save()
      CommandCfg.save()
    } catch (err: any) {
      return {
        success: false, message: '保存失败：' + err.message
      }
    }

    return {
      success: true, message: '保存成功'
    }
  }
})
