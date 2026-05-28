import type { CodeMasterRow } from '../../src/types/domain'

/** Mirrors server CODE_MASTER_TYPE_META for mock /api/code-master/types */
export const MOCK_CODE_MASTER_TYPE_META: Record<string, string> = {
  staff_role: '员工角色',
  staff_account_status: '账号状态',
  staff_department: '部门',
  staff_job_title: '职位',
  property_type: '房源类型',
  property_status_tag: '房源状态（列表/筛选）',
  property_listing_status: '对外租售状态',
  customer_pool: '客户池（公有/私有）',
}

const SEED: Omit<CodeMasterRow, 'id'>[] = [
  { typeCode: 'staff_role', itemCode: 'sales', label: '业务员', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'staff_role', itemCode: 'dept_mgr', label: '部门经理', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'staff_role', itemCode: 'super_admin', label: '超级管理员', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'staff_account_status', itemCode: 'ok', label: '正常', sortOrder: 10, isActive: 1, remark: null },
  {
    typeCode: 'staff_account_status',
    itemCode: 'disabled_resigned',
    label: '禁用（离职）',
    sortOrder: 20,
    isActive: 1,
    remark: null,
  },
  { typeCode: 'staff_account_status', itemCode: 'frozen_risk', label: '冻结（风控）', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'staff_department', itemCode: 'hq', label: '总经办', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'staff_department', itemCode: 'hp1', label: '黄埔业务一部', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'staff_department', itemCode: 'ns2', label: '南沙业务二部', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'staff_department', itemCode: 'ops', label: '运营中心', sortOrder: 40, isActive: 1, remark: null },
  { typeCode: 'staff_department', itemCode: 'hr', label: '人事行政', sortOrder: 50, isActive: 1, remark: null },
  { typeCode: 'staff_job_title', itemCode: 'director', label: '部门总监', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'staff_job_title', itemCode: 'mgr', label: '业务经理', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'staff_job_title', itemCode: 'senior_sales', label: '高级业务员', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'staff_job_title', itemCode: 'sales', label: '业务员', sortOrder: 40, isActive: 1, remark: null },
  { typeCode: 'staff_job_title', itemCode: 'hr_staff', label: '人事专员', sortOrder: 50, isActive: 1, remark: null },
  { typeCode: 'customer_pool', itemCode: 'private', label: '私有', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'customer_pool', itemCode: 'public', label: '公有', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'standard', label: '标准厂房', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'standalone', label: '独门独院厂房', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'warehouse', label: '仓库', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'land_ind', label: '工业用地', sortOrder: 40, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'office', label: '写字楼', sortOrder: 50, isActive: 1, remark: null },
  { typeCode: 'property_type', itemCode: 'park_shop', label: '产业园商铺', sortOrder: 60, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'draft', label: '草稿', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'pending_audit', label: '待审核', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'rejected', label: '驳回', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'pending_dev', label: '待开发', sortOrder: 35, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'for_rent', label: '待租', sortOrder: 40, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'rented', label: '已租', sortOrder: 50, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'for_sale', label: '待售', sortOrder: 60, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'sold', label: '已售', sortOrder: 70, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'intent', label: '意向中', sortOrder: 80, isActive: 1, remark: null },
  { typeCode: 'property_status_tag', itemCode: 'archived', label: '下架封存', sortOrder: 90, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'pending_dev', label: '待开发', sortOrder: 8, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'for_rent', label: '待租', sortOrder: 10, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'rented', label: '已租', sortOrder: 20, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'for_sale', label: '待售', sortOrder: 30, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'sold', label: '已售', sortOrder: 40, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'for_rent_sale', label: '待租售', sortOrder: 45, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'intent', label: '意向中', sortOrder: 50, isActive: 1, remark: null },
  { typeCode: 'property_listing_status', itemCode: 'archived', label: '下架封存', sortOrder: 60, isActive: 1, remark: null },
]

function withIds(rows: Omit<CodeMasterRow, 'id'>[]): CodeMasterRow[] {
  let id = 1
  return rows.map((r) => ({ ...r, id: id++ }))
}

export let mockCodeMasterRows: CodeMasterRow[] = withIds(SEED)

let nextId = mockCodeMasterRows.length + 1

export function resetMockCodeMaster() {
  mockCodeMasterRows = withIds(SEED)
  nextId = mockCodeMasterRows.length + 1
}

const ITEM_CODE_RE = /^[a-z][a-z0-9_]{0,63}$/

export function mockListCodeMaster(type: string, includeInactive: boolean) {
  const t = String(type || '').trim()
  if (!MOCK_CODE_MASTER_TYPE_META[t]) throw new Error('invalid type')
  return mockCodeMasterRows
    .filter((r) => r.typeCode === t && (includeInactive || Number(r.isActive) === 1))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
}

export function mockCreateCodeMaster(body: Record<string, unknown>) {
  const typeCode = String(body.typeCode || '').trim()
  if (!MOCK_CODE_MASTER_TYPE_META[typeCode]) throw new Error('invalid type')
  const itemCode = String(body.itemCode || '').trim().toLowerCase()
  const label = String(body.label || '').trim()
  if (!ITEM_CODE_RE.test(itemCode)) throw new Error('bad itemCode')
  if (!label) throw new Error('empty label')
  if (mockCodeMasterRows.some((r) => r.typeCode === typeCode && r.itemCode === itemCode)) throw new Error('dup')
  const row: CodeMasterRow = {
    id: nextId++,
    typeCode,
    itemCode,
    label,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    isActive: body.isActive === false || body.isActive === 0 ? 0 : 1,
    remark: body.remark != null ? String(body.remark).trim().slice(0, 255) || null : null,
  }
  mockCodeMasterRows.push(row)
  return row
}

export function mockUpdateCodeMaster(id: number, body: Record<string, unknown>) {
  const i = mockCodeMasterRows.findIndex((r) => r.id === id)
  if (i < 0) throw new Error('not found')
  const typeCode = String(body.typeCode || '').trim()
  if (!MOCK_CODE_MASTER_TYPE_META[typeCode]) throw new Error('invalid type')
  const itemCode = String(body.itemCode || '').trim().toLowerCase()
  const label = String(body.label || '').trim()
  if (!ITEM_CODE_RE.test(itemCode)) throw new Error('bad itemCode')
  if (!label) throw new Error('empty label')
  if (mockCodeMasterRows.some((r) => r.typeCode === typeCode && r.itemCode === itemCode && r.id !== id)) throw new Error('dup')
  mockCodeMasterRows[i] = {
    id,
    typeCode,
    itemCode,
    label,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    isActive: body.isActive === false || body.isActive === 0 ? 0 : 1,
    remark: body.remark != null ? String(body.remark).trim().slice(0, 255) || null : null,
  }
  return mockCodeMasterRows[i]
}

export function mockDeleteCodeMaster(id: number) {
  const i = mockCodeMasterRows.findIndex((r) => r.id === id)
  if (i < 0) throw new Error('not found')
  mockCodeMasterRows.splice(i, 1)
}
