/** Up to 2 chars for customer placeholder avatar (contact name preferred). */
export function customerInitials(input: {
  contactName?: string
  titleLine?: string
  company?: string
  name?: string
}): string {
  const name = String(input.contactName || input.name || input.titleLine?.split('·')[0]?.trim() || '').trim()
  if (name) {
    const compact = name.replace(/\s+/g, '')
    if (compact.length <= 2) return compact
    return compact.slice(-2)
  }
  const company = String(input.company || '').trim()
  if (company) {
    const compact = company.replace(/\s+/g, '')
    return compact.length <= 2 ? compact : compact.slice(0, 2)
  }
  return '客'
}

export function customerAvatarToneClass(grade?: string): string {
  const g = String(grade || '').trim()
  if (g.startsWith('A')) return 'crm-avatar--brand'
  if (g.startsWith('B')) return 'crm-avatar--blue'
  return 'crm-avatar--slate'
}
