import { dir } from '@/dir'
import { CommandEnum } from '@/types/apps'
import karin from 'node-karin'
import path from 'node:path'

export const renderTemplate = async (template: CommandEnum, rendeDdata: Record<string, any>) => 'base64://' + await karin.render({
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
  },
  name: `${dir.name}/${template}`,
  selector: 'container',
  file: path.join(dir.pluginDir, `resources/template/${template}/index.html`),
  setViewport: {
    deviceScaleFactor: 2
  }
})
