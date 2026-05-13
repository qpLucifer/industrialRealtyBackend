/** Phone whitelist — maps to phone_whitelist, synced with mini-program */

export interface WhitelistRow {
  phone: string
  name: string
  remark: string
  updatedBy: string
  updatedAt: string
}

export const mockWhitelistRows: WhitelistRow[] = [
  { phone: '13800138001', name: '陈思远', remark: '在职', updatedBy: '周瑾', updatedAt: '2026-05-08' },
  { phone: '13900139002', name: '王敏', remark: '经理编制', updatedBy: '周瑾', updatedAt: '2026-05-07' },
]
