/** Properties listing — status_tag merges workflow (草稿/待审核/驳回) + business states after pass */

export type PropertyStatusTag =
  | '草稿'
  | '待审核'
  | '驳回'
  | '待开发'
  | '出租'
  | '已租'
  | '出售'
  | '已售'
  | '待租售'
  | '意向中'
  | '下架封存'

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
  rowMuted?: boolean
}

export const mockPropertyRows: PropertyRow[] = [
  {
    id: 'p1',
    code: 'P-8821',
    title: '黄埔科学城 · 单层厂房',
    district: '黄埔区',
    type: '标准厂房',
    status: '出租',
    listingLine1: '出租',
    listingLine2: '审核通过 · 已上架',
    submitter: '陈思远',
  },
  {
    id: 'p2',
    code: 'P-7730',
    title: '花都汽车城 · 独院',
    district: '花都区',
    type: '独门独院厂房',
    status: '待审核',
    listingLine1: '待审核',
    listingLine2: '已提交发布，等待审核',
    submitter: '赵琦',
  },
  {
    id: 'p3',
    code: 'P-DRAFT-001',
    title: '南沙万顷沙 · 单层仓（草稿）',
    district: '南沙区',
    type: '仓库',
    status: '草稿',
    listingLine1: '仅草稿',
    listingLine2: '保存为草稿 · 发布后进入待审核',
    submitter: '陈思远',
    rowMuted: true,
  },
]
