/** Staff accounts — maps to staff_user, role, region_ids JSON */

export type StaffRole = '业务员' | '部门经理' | '超级管理员'
export type StaffStatus = '正常' | '禁用' | '冻结'

export type StaffAccountStatus = '正常' | '禁用（离职）' | '冻结（风控）'

export interface StaffRow {
  id: string
  employeeNo: string
  name: string
  phoneMasked: string
  role: StaffRole
  regions: string
  status: StaffStatus
}

export interface StaffForm {
  employeeNo: string
  name: string
  phone: string
  email: string
  department: string
  title: string
  hireDate: string
  accountStatus: StaffAccountStatus
  role: StaffRole
  regionIds: string[]
  dataScopeHint: string
  wecomUserId: string
  openIdHint: string
  remark: string
}

export const mockStaffRows: StaffRow[] = [
  {
    id: 's1',
    employeeNo: 'E-900218',
    name: '陈思远',
    phoneMasked: '138****6281',
    role: '业务员',
    regions: '黄埔区、增城区',
    status: '正常',
  },
  {
    id: 's2',
    employeeNo: 'M-800011',
    name: '王敏',
    phoneMasked: '139****2048',
    role: '部门经理',
    regions: '华南大区（辖）',
    status: '正常',
  },
]

export const mockStaffFormDefault: StaffForm = {
  employeeNo: 'E-900218',
  name: '陈思远',
  phone: '13800138001',
  email: 'chen@company.internal',
  department: '华东事业部 / 招商一组',
  title: '资深置业顾问',
  hireDate: '2024-03-01',
  accountStatus: '正常',
  role: '业务员',
  regionIds: ['440112', '440118'],
  dataScopeHint: '授权区域内房源 + 本人私有客户 + 公有池只读',
  wecomUserId: 'ChenSiYuan',
  openIdHint: 'oXXXX … 已绑定',
  remark: '已通过保密培训 2026-Q1',
}

export const mockRegionChipOptions = [
  { id: '440112', label: '黄埔区' },
  { id: '440118', label: '增城区' },
  { id: '440115', label: '南沙区' },
  { id: '440114', label: '花都区' },
]
