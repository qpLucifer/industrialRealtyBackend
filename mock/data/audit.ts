/** Audit queue — maps to property_audit_task */

export interface AuditQueueRow {
  code: string
  title: string
  submitter: string
  submittedAt: string
  riskTag: string
}

export const mockAuditQueue: AuditQueueRow[] = [
  {
    code: 'P-7730',
    title: '花都汽车城 · 独院',
    submitter: '赵琦',
    submittedAt: '今天 08:40',
    riskTag: '首次发布',
  },
]
