/** Audit queue mock — shape matches `AuditQueueRow` in domain */

import type { AuditQueueRow } from '../../src/types/domain'

export const mockAuditQueue: AuditQueueRow[] = [
  {
    code: 'P-7730',
    title: '花都汽车城 · 独院',
    submitter: '赵琦',
    submittedAt: '2026-05-13 08:40',
    riskTag: '首次发布',
    district: '花都区',
    type: '独门独院厂房',
    listingLine1: '待审核 · 资料齐',
    listingLine2: '未跟进',
    metaLine: '独院 · 丙二类',
    specLine: '占地约 11 亩 · 层高 8m',
    priceLine: '面议',
    auditHint: '请核对产权证与现场照片一致性',
    detailTitle: '花都汽车城 · 独院',
  },
]
