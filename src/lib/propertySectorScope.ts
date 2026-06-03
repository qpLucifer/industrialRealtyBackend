import type { StaffPropertySectorScope } from '@/types/domain'

export function staffPropertySectorLabel(scope?: string | null): string {
  const s = String(scope || 'both').trim().toLowerCase() as StaffPropertySectorScope
  if (s === 'sale') return '出售板块'
  if (s === 'rent') return '出租板块'
  return '出售+出租'
}
