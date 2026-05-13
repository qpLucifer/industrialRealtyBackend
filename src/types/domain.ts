/** Frontend domain types — aligned with mock/data for future OpenAPI / DB */

export interface AuthUser {
  displayName: string
  roleLine: string
  avatarUrl?: string
}

export interface KpiItem {
  label: string
  value: string
  trend: string
}

export interface RegionBar {
  label: string
  heightPct: number
}

export interface StaffActivityRow {
  name: string
  followUps: number
  viewings: number
  deals: number
}

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

export interface WhitelistRow {
  phone: string
  name: string
  remark: string
  updatedBy: string
  updatedAt: string
}

export interface RegionTreeLine {
  text: string
  indentPx: number
}

export interface RegionBindingRow {
  staffName: string
  nodeIds: string
  crossExport: '禁止' | '允许'
  crossView: '禁止' | '允许'
}

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

export interface AuditQueueRow {
  code: string
  title: string
  submitter: string
  submittedAt: string
  riskTag: string
}

export type CustomerGrade = 'A 类' | 'B 类' | 'C 类'

export interface CustomerRow {
  id: string
  phoneMasked: string
  name: string
  addressHint: string
  demandSummary: string
  grade: CustomerGrade
  lastFollowAt: string
  nextReminder: string | '—'
  timelineHtml: string
  ownerName: string
  hasNextReminderTag?: 'amber' | 'mint'
}

export interface VideoFaqRow {
  id: string
  keywords: string
  question: string
  industry: string
  videoPath: string
  tags: { label: string; tone: 'cyan' | 'mint' | 'amber' }[]
  miniProgramSearch: boolean
  updatedAt: string
}

export interface ViewingRow {
  start: string
  end: string
  propertyRef: string
  customerName: string
  companions: string
  score: string
}

export interface DealRow {
  contractType: string
  amount: string
  commission: string
  invoiceType: string
  archiveStatus: string
}

export interface AnnouncementRow {
  title: string
  scope: string
  popup: string
  schedule: string
  status: '已发送' | '计划中'
  statusTone: 'mint' | 'amber'
}

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

export interface SecuritySwitch {
  key: string
  label: string
  enabled: boolean
}

export interface PropertyFullForm {
  code: string
  types: string[]
  companyName: string
  address: string
  lat: string
  lng: string
  mapTitle: string
  ownerContact: string
  photoChecklist: string[]
  mediaUrls: string
  landMu: number
  actualLandMu: number
  buildingArea: number
  actualUseArea: number
  floors: number
  loadPerSqm: number
  workshopSize: string
  loadNote: string
  structureTypes: string[]
  structureOther: string
  powerKva: number
  transformers: number
  freightLifts: number
  liftLoadT: number
  liftDims: string
  platformHeightCm: number
  turnRadiusM: number
  dormRent: number
  dormDistanceKm: number
  dining: string
  transitStation: string
  stationDistanceM: number
  selfUseSqm: number
  rentEstimateYear: number
  coTenantCount: number
  annualRent: number | null
  tenantCompanies: string
  contractYearsLeft: number | null
  vacantMonths: number
  usageRemark: string
  propertyRights: string[]
  propertyRightsOther: string
  landUse: string[]
  landUseOther: string
  certificates: string[]
  mortgageDispute: string
  mortgageNote: string
  landlordPriceWan: number | null
  tradeMode: string
  taxFeeNote: string
  allowedIndustries: string
  specialLimits: string
  fireSystems: string[]
  fireOther: string
  firePass: string
  monitorCoverage: string
  fireFailReason: string
  highwayKm: number
  portAirportKm: number
  roadLimits: string
  rushHour: string
  subsidy: string
  subsidyDetail: string
  taxBenefit: string
  envLevel: string
  dischargePermit: string
  solar: string
  highlights: string
  risks: string
  assessment: string
  externalStatus: string
  rentSaleType: string
  rentListSqm: number
  propertyFee: number
  contactName: string
  contactPhone: string
  viewingNote: string
  internalNote: string
}
