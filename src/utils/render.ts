import { dir } from '@/dir'
import { CommandEnum } from '@/types/apps'
import karin, { config } from 'node-karin'
import path from 'node:path'

export const renderTemplate = async (template: CommandEnum, rendeDdata: Record<string, any>, type: 'png' | 'jpeg' | 'webp' = 'jpeg') => 'base64://' + await karin.render({
  name: `${dir.name}/${template}`,
  data: {
    ...rendeDdata,
    plugin: {
      name: dir.name,
      version: dir.version,
      template,
      resources: {
        default: path.join(dir.pluginDir, 'resources').replace(/\\/g, '/'),
        download: dir.ResourcesDir.replace(/\\/g, '/'),
      },
      defaultLayout: path.join(dir.pluginDir, 'resources/template/layout/default.html')
    },
    karin: {
      version: config.pkg().version
    }
  },

  type,
  omitBackground: type === 'png',
  selector: 'container',
  file: path.join(dir.pluginDir, `resources/template/${template}/index.html`),
  setViewport: {
    deviceScaleFactor: 2
  }
})
