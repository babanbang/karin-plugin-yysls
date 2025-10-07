import { dir } from '@/dir'
import karin from 'node-karin'
import path from 'node:path'

export const renderTemplate = async (template: string, data: Record<string, any>) => await karin.render({
  data: {
    ...data,
    plugin: {
      name: dir.name,
      version: dir.version,
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
})
