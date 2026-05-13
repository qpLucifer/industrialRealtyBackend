/** Properties listing — maps to property, listing_workflow, audit_state */

export type PropertyStatusTag = '待租' | '已租' | '待售' | '已售' | '意向中' | '下架封存' | '草稿'
export type AuditTag = '已通过' | '待审核' | '—'

export interface PropertyRow {
  id: string
  code: string
  title: string
  district: string
  type: string
  status: PropertyStatusTag
  listingLine1: string
  listingLine2: string
  submitter: string
  audit: AuditTag
  rowMuted?: boolean
}

export const mockPropertyRows: PropertyRow[] = [
  {
    id: 'p1',
    code: 'P-8821',
    title: '黄埔科学城 · 单层厂房',
    district: '黄埔',
    type: '标准厂房',
    status: '待租',
    listingLine1: '已上架 · v3',
    listingLine2: '审核→发布→对内可见',
    submitter: '陈思远',
    audit: '已通过',
  },
  {
    id: 'p2',
    code: 'P-7730',
    title: '花都汽车城 · 独院',
    district: '花都',
    type: '独门独院厂房',
    status: '意向中',
    listingLine1: '待审核',
    listingLine2: '提交后排队中',
    submitter: '赵琦',
    audit: '待审核',
  },
  {
    id: 'p3',
    code: 'P-DRAFT-001',
    title: '南沙万顷沙 · 单层仓（草稿）',
    district: '南沙',
    type: '仓库',
    status: '草稿',
    listingLine1: '仅草稿',
    listingLine2: '未提交审核 · 可继续改',
    submitter: '陈思远',
    audit: '—',
    rowMuted: true,
  },
]
