/** Audit logs — maps to audit_log */

export type LogKind = 'prop' | 'cust' | 'acct'
export type LogAction = 'login' | 'view' | 'edit' | 'share' | 'export'

export interface LogRow {
  time: string
  actor: string
  objectLabel: string
  actionLabel: string
  detail: string
  kind: LogKind
  action: LogAction
}

export const mockLogs: LogRow[] = [
  { time: '10:22:06', actor: '陈思远', objectLabel: '房源 #P-8821', actionLabel: '查看详情', detail: 'Session JTI ···', kind: 'prop', action: 'view' },
  { time: '昨天 16:05', actor: '王敏', objectLabel: '房源 #P-8821', actionLabel: '编辑', detail: 'diff 层高 8.5→9.0', kind: 'prop', action: 'edit' },
  { time: '昨天 11:40', actor: '陈思远', objectLabel: '房源 #P-8821', actionLabel: '内部转发', detail: 'share_token ttl=24h', kind: 'prop', action: 'share' },
  { time: '昨天 09:18', actor: '陈思远', objectLabel: '客户 张晨', actionLabel: '编辑 ABC', detail: 'A→A · 下次提醒 明天 10:00', kind: 'cust', action: 'edit' },
  { time: '前天 15:02', actor: '赵琦', objectLabel: '客户 台州星兔塑业', actionLabel: '查看', detail: '脱敏浏览', kind: 'cust', action: 'view' },
  { time: '前天 08:55', actor: '王敏', objectLabel: '账号 E-900218', actionLabel: '登录', detail: '小程序 · 黄埔区节点', kind: 'acct', action: 'login' },
  { time: '上周四', actor: '赵琦', objectLabel: '房源 批量', actionLabel: '导出尝试', detail: '策略拒绝 · 已记审计', kind: 'prop', action: 'export' },
]
