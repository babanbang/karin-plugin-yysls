import { getGameInfo } from '@/core/api'
import { Command } from '@/core/command'
import { CommandCfg } from '@/core/config'
import { User } from '@/core/user'
import { CommandEnum } from '@/types/apps'
import karin from 'node-karin'
import { showRoleList } from './roleList'

const LoginCmd = Command.getCommand(CommandEnum.Login, '')
export const login = karin.command(
  LoginCmd, async (e, next) => {
    if (!CommandCfg.get<boolean>(`${CommandEnum.Login}.enable`)) next()

    let token = e.msg.replace(LoginCmd, '').trim()
    if (!token) {
      await e.reply('请发送access_token进行绑定', { at: true })

      const ctx = await karin.ctx(e, {
        replyMsg: '等待超时，已取消绑定！'
      })
      if (!ctx) return true

      token = ctx.msg.replace(LoginCmd, '').trim()
    }

    if (!token) {
      await e.reply('未获取到access_token，已取消绑定！', { at: true })

      return true
    }

    const gameInfo = await getGameInfo.init({ accessToken: token }).request(null)

    switch (gameInfo.code) {
      case -1:
        await e.reply('access_token错误或已过期，请重新获取！', { at: true })

        return true
      case 200:
      case -100031: {
        if (!gameInfo.data) {
          await e.reply('绑定access_token失败，请先在官方小程序绑定角色！', { at: true })
        } else {
          const user = await User.create(e.userId, false)

          const roleId = gameInfo.data.roleId
          await user.saveUserInfo({
            mainUid: roleId,
            uidList: user.uidList.add(roleId, true)
          })

          await user.saveAccountInfo(roleId, {
            name: gameInfo.data.roleName,
            level: gameInfo.data.level,
            club: gameInfo.data.clubName,
            avatar: gameInfo.data.roleAvatar,
            accessToken: token,
          })

          await showRoleList(e)
        }

        return true
      }
      default:
        await e.reply('绑定access_token失败：' + gameInfo.msg, { at: true })
    }

    return true
  }
)
