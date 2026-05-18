/** Staff accounts — maps to staff table + region_ids JSON (mock) */

export type StaffStatus = '正常' | '禁用' | '冻结'

export type StaffAccountStatus = '正常' | '禁用（离职）' | '冻结（风控）'

export interface StaffRow {
  id: string
  employeeNo: string
  name: string
  phoneMasked: string
  department: string
  title: string
  regions: string
  status: StaffStatus
  avatarUrl?: string
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
  regionIds: string[]
  dataScopeHint: string
  wechatNickname: string
  miniProgramOpenId: string
  avatarUrl: string
  remark: string
}

export const mockStaffRows: StaffRow[] = [
  {
    id: 's1',
    employeeNo: 'E-900218',
    name: '陈思远',
    phoneMasked: '138****6281',
    department: '黄埔业务一部',
    title: '高级业务员',
    regions: '黄埔区、增城区',
    status: '正常',
    avatarUrl: '',
  },
  {
    id: 's2',
    employeeNo: 'M-800011',
    name: '王敏',
    phoneMasked: '139****2048',
    department: '运营中心',
    title: '业务经理',
    regions: '花都区',
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
  regionIds: ['黄埔区', '增城区'],
  dataScopeHint: '授权区域：黄埔区、增城区',
  wechatNickname: '陈思远',
  miniProgramOpenId: 'oXXXX_mock_openid_chen',
  avatarUrl: '',
  remark: '已通过保密培训 2026-Q1',
}
