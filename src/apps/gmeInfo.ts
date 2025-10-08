import { Command } from '@/core/command'
import { User } from '@/core/user'
import { CommandEnum } from '@/types/apps'
import { UidInfoType } from '@/types/core/user'
import { renderTemplate } from '@/utils'
import karin, { segment } from 'node-karin'

const RoleListCmd = Command.getCommand(CommandEnum.RoleList, '')
export const RoleList = karin.command(
  RoleListCmd,
  async (e) => {
    const user = await User.create(e.userId, true)

    if (user.uidList.length > 1) {
      const idx = Number(e.msg.replace(RoleListCmd, '').trim())
      if (!isNaN(idx) && idx > 0 && idx <= user.uidList.length + 1) {
        user.saveUserInfo({
          mainUid: user.uidList[idx - 1],
        })
      }

      await user.refresh(true)
    }

    const renderData: {
      roleList: Omit<UidInfoType, 'accessToken'>[]
    } = {
      roleList: user.uidInfoList.map(uidinfo => {
        const { accessToken, ...rest } = uidinfo

        return rest
      })
    }

    const image = await renderTemplate(CommandEnum.RoleList, renderData)

    await e.reply(segment.image(image), { at: true })

    return true
  }
)
