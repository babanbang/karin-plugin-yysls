import { normalPushKeys } from '@/apps/pushManger'
import { Cfg, CommandCfg, CommandType, DailySignPermission, DailySignTaskPermission, PushContactType, PushListCfg, PushTargetType } from '@/core/config'
import { dir } from '@/dir'
import { Database, Dialect } from '@/module/database'
import { CommandDescription, CommandEnum } from '@/types/apps'
import { components, defineConfig, logger } from 'node-karin'
import lodash from 'node-karin/lodash'

type ConfigSaveEntry = { 'database-dialect': Dialect } &
  Record<`${CommandEnum.DailySign}-permission`, DailySignPermission> &
  Record<`${CommandEnum.DailySignTask}-auto`, boolean> &
  Record<`${CommandEnum.DailySignTask}-corn`, string> &
  Record<`${CommandEnum.DailySignTask}-globalPush`, ('Master' | 'Admin')[]> &
  Record<`${CommandEnum.DailySignTask}-permission`, DailySignTaskPermission>

type CommandSaveEntry = Record<`group-${CommandEnum}-cmds`, string[]> &
  Record<`${CommandEnum}-enable`, boolean> &
  Record<`${CommandEnum}-default`, boolean> &
  Record<`${CommandEnum}-flags`, boolean>

type PushSaveEntry = Record<`group-globalMaster-${string}`, string[]> &
  Record<`group-globalAdmin-${string}`, string[]> &
  Record<`group-${CommandEnum}-${string}`, string[]>

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
          className: 'flex flex-wrap items-center gap-4',
          children: [
            components.select.create('database-dialect', {
              label: '数据库',
              className: 'w-full',
              description: '切换数据库后并不会自动转移旧数据至新数据库',
              defaultValue: Cfg.get<Dialect>('database.dialect'),
              items: Database.details.map(({ dialect, desc }) => components.select.createItem(`select-${dialect}`, {
                label: dialect, value: dialect, description: desc
              }))
            })
          ]
        }),
        components.accordion.createItem(`accordion-${CommandEnum.DailySign}-item-key`, {
          title: '每日签到',
          subtitle: '设置每日签到功能的「使用权限」',
          className: 'flex flex-wrap items-center gap-4',
          children: [
            components.select.create(`${CommandEnum.DailySign}-permission`, {
              label: '权限设置',
              className: 'w-full',
              defaultValue: Cfg.get<DailySignPermission>(`${CommandEnum.DailySign}.permission`),
              items: [
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.Everyone}`, {
                  label: '所有人', value: DailySignPermission.Everyone, description: '所有人可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.Master}`, {
                  label: 'Bot主人', value: DailySignPermission.Master, description: '仅Bot主人可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.Admin}`, {
                  label: 'Bot管理员', value: DailySignPermission.Admin, description: '仅Bot管理员及主人可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.MemberWhite}`, {
                  label: '成员白名单', value: DailySignPermission.MemberWhite, description: '仅白名单成员、Bot管理员及主人可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.MemberBlack}`, {
                  label: '成员黑名单', value: DailySignPermission.MemberBlack, description: '仅黑名单成员不可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.GroupWhite}`, {
                  label: '群白名单', value: DailySignPermission.GroupWhite, description: '仅白名单群、Bot管理员及主人可用'
                }),
                components.select.createItem(`select-${CommandEnum.DailySign}-permission-${DailySignPermission.GroupBlack}`, {
                  label: '群黑名单', value: DailySignPermission.GroupBlack, description: '仅黑名单群不可用'
                })
              ]
            }),
          ]
        }),
        components.accordion.createItem(`accordion-${CommandEnum.DailySignTask}-item-key`, {
          title: '定时签到任务',
          subtitle: '定时签到任务配置',
          className: 'flex flex-wrap items-center gap-4',
          children: [
            components.switch.create(`${CommandEnum.DailySignTask}-auto`, {
              defaultSelected: Cfg.get<boolean>(`${CommandEnum.DailySignTask}.auto`),
              label: '启用自动签到任务',
              description: '关闭后只能由Bot主人及管理员手动触发签到任务'
            }),
            components.input.string(`${CommandEnum.DailySignTask}-corn`, {
              label: 'Corn表达式',
              description: '设置签到任务自动执行时间',
              defaultValue: Cfg.get<string>(`${CommandEnum.DailySignTask}.corn`),
              rules: [

              ]
            }),
            components.checkbox.group(`${CommandEnum.DailySignTask}-globalPush`, {
              label: '全局推送对象',
              defaultValue: Cfg.get<'Master' | 'Admin'>(`${CommandEnum.DailySignTask}.globalPush`, true),
              checkbox: [
                components.checkbox.create(`${CommandEnum.DailySignTask}-globalPush-Master`, {
                  label: 'Bot主人', value: 'Master'
                }),
                components.checkbox.create(`${CommandEnum.DailySignTask}-globalPush-Admin`, {
                  label: 'Bot管理员', value: 'Admin'
                })
              ]
            }),
            components.select.create(`${CommandEnum.DailySignTask}-permission`, {
              label: '签到任务名单限制',
              className: 'w-full',
              defaultValue: Cfg.get<DailySignTaskPermission>(`${CommandEnum.DailySignTask}.permission`),
              items: [
                components.select.createItem(`select-${CommandEnum.DailySignTask}-permission-${DailySignTaskPermission.Everyone}`, {
                  label: '所有人', value: DailySignPermission.Everyone, description: '签到任务名单包含所有已绑定成员'
                }),
                // components.select.createItem(`select-${CommandEnum.DailySignTask}-permission-${DailySignTaskPermission.MemberWhite}`, {
                //   label: '成员白名单', value: DailySignTaskPermission.MemberWhite, description: '签到任务名单仅包含白名单内成员'
                // }),
                // components.select.createItem(`select-${CommandEnum.DailySignTask}-permission-${DailySignTaskPermission.MemberBlack}`, {
                //   label: '成员黑名单', value: DailySignTaskPermission.MemberBlack, description: '签到任务名单不包含黑名单内成员'
                // }),
                components.select.createItem(`select-${CommandEnum.DailySignTask}-permission-${DailySignTaskPermission.UidWhite}`, {
                  label: 'UID白名单', value: DailySignTaskPermission.UidWhite, description: '签到任务名单仅包含白名单内UID'
                }),
                components.select.createItem(`select-${CommandEnum.DailySignTask}-permission-${DailySignTaskPermission.UidBlack}`, {
                  label: 'UID黑名单', value: DailySignTaskPermission.UidBlack, description: '签到任务名单不包含黑名单内UID'
                })
              ]
            }),
          ]
        })
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
          className: 'flex flex-wrap justify-center items-center gap-4',
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

    components.divider.horizontal('divider-push-key'),
    components.accordion.create('accordion-push-key', {
      label: '推送设置（请使用对应的指令添加推送）',
      children: [
        components.accordion.createItem('accordion-push-globalMaster', {
          title: '全局推送「主人」',
          subtitle: '指令「#燕云(十六声)?(添加|删除)全局主人推送(id/@)」',
          children: Object.entries(PushListCfg.get<PushTargetType>('globalMaster')).map(([key, value]) => components.input.group(`group-globalMaster-${key}`, {
            label: `Bot: ${key}`,
            data: value,
            template: components.input.string(`template-globalMaster-${key}`, {
              label: '主人ID'
            })
          })),
        }),
        components.accordion.createItem('accordion-push-globalAdmin', {
          title: '全局推送「管理员」',
          subtitle: '指令「#燕云(十六声)?(添加|删除)全局管理员推送(id/@)」',
          children: Object.entries(PushListCfg.get<PushTargetType>('globalAdmin')).map(([key, value]) => components.input.group(`group-globalAdmin-${key}`, {
            label: `Bot: ${key}`,
            data: value,
            template: components.input.string(`template-globalAdmin-${key}`, {
              label: '管理员ID'
            })
          })),
        }),
        ...Object.entries(normalPushKeys).map(([name, command]) => components.accordion.createItem(`accordion-push-${command}`, {
          title: `全局推送「${name}」`,
          subtitle: `指令「#燕云(十六声)?(开启|关闭)${name}推送」`,
          description: '此指令必须在需要开启或关闭的群或私聊中使用',
          children: Object.entries(PushListCfg.get<PushContactType>(command))
            .map(([key, value]) => components.input.group(`group-${command}-${key}`, {
              label: `Bot: ${key}`,
              data: value.map(v => JSON.stringify(v)),
              template: components.input.string(`template-${command}-${key}`, {
                label: 'Contact'
              })
            })),
        })),
      ]
    }),

    components.divider.horizontal('divider-whiteList-key'),
    components.accordion.create('accordion-whiteList-key', {
      label: '白名单设置',
      children: [

      ]
    }),

    components.divider.horizontal('divider-blackList-key'),
    components.accordion.create('accordion-blackList-key', {
      label: '黑名单设置',
      children: [

      ]
    }),
  ],

  /** 前端点击保存之后调用的方法 */
  save: (config: {
    'accordion-config-key': ConfigSaveEntry[]
    'accordion-command-key': CommandSaveEntry[]
    'accordion-push-key': PushSaveEntry[]
    'accordion-whiteList-key': []
    'accordion-blackList-key': []
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

            const cmds = CommandCfg.get<string>(`${command.key}.cmds`, true).clear()
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
      logger.error(err)

      return {
        success: false, message: '保存失败：' + err.message
      }
    }

    return {
      success: true, message: '保存成功'
    }
  }
})
