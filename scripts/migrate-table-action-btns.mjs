import fs from 'node:fs'
import path from 'node:path'

const viewsDir = path.join(import.meta.dirname, '../src/views')
const typeToVariant = {
  primary: 'primary',
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  default: 'neutral',
}

const tooltipRe =
  /<el-tooltip content="([^"]+)" placement="top">\s*<el-button\s+type="(\w+)"\s+:icon="(\w+)"\s+circle\s+plain\s+size="small"((?:\s+:\w+(?:="[^"]*"|=\{[^}]+\}))?)\s+@click="([^"]+)"\s*\/>\s*<\/el-tooltip>/g

function migrate(content) {
  let out = content
  out = out.replace(tooltipRe, (_, title, type, icon, extra, click) => {
    const variant = typeToVariant[type] ?? 'primary'
    const variantAttr = variant === 'primary' ? '' : ` variant="${variant}"`
    const extraTrim = extra.trim()
    return `<TableActionBtn title="${title}" :icon="${icon}"${variantAttr}${extraTrim ? ` ${extraTrim}` : ''} @click="${click}" />`
  })
  return out
}

function ensureImport(content) {
  if (!content.includes('TableActionBtn')) return content
  if (content.includes("from '@/components/TableActionBtn.vue'")) return content
  const iconImport = content.match(/import \{([^}]+)\} from '@element-plus\/icons-vue'/)
  if (!iconImport) return content
  return content.replace(
    iconImport[0],
    `import TableActionBtn from '@/components/TableActionBtn.vue'\n${iconImport[0]}`,
  )
}

for (const name of fs.readdirSync(viewsDir)) {
  if (!name.endsWith('.vue')) continue
  const file = path.join(viewsDir, name)
  let s = fs.readFileSync(file, 'utf8')
  const next = ensureImport(migrate(s))
  if (next !== s) {
    fs.writeFileSync(file, next)
    console.log('updated', name)
  }
}
