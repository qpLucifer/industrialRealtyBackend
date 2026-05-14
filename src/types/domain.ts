/** Frontend domain types — aligned with mock/data for future OpenAPI / DB */

export interface AuthUser {
  displayName: string
  roleLine: string
  avatarUrl?: string
}

/** sys_users with user_kind=admin — admin panel operators */
export interface SysAdminUserRow {
  id: number
  username: string
  displayName: string
  roleLine: string
  avatarUrl: string | null
  userKind: 'admin'
  /** Whether a non-empty password_hash exists on server */
  hasLoginPassword: boolean
  createdAt: string
}

export interface KpiItem {
  label: string
  value: string
  trend?: string
}

export interface RegionBar {
  label: string
  heightPct: number
  /** Raw property count in this bucket (for charts) */
  count?: number
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
  id?: string
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
  /** WeChat display name (stored in staff.wecom_user_id) */
  wechatNickname: string
  /** Mini program OpenId hint (stored in staff.open_id_hint) */
  miniProgramOpenId: string
  remark: string
}

export interface WhitelistRow {
  id: number
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
  id?: number
  staffName: string
  /** Comma-separated region names (same as region_defs.name) */
  nodeIds: string
}

/** Master list of business region names — CRUD in 区域权限 */
export interface RegionDefRow {
  id: number
  name: string
  sortOrder?: number
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
  /** Derived: listing_line2 contains 已跟进 → 已跟进 */
  followUpDone?: boolean
}

export interface AuditQueueRow {
  code: string
  title: string
  submitter: string
  submittedAt: string
  /** From `properties.risk_tag`, editable in 房源编辑 */
  riskTag: string
  district?: string
  type?: string
  listingLine1?: string
  listingLine2?: string
  metaLine?: string
  specLine?: string
  priceLine?: string
  auditHint?: string
  detailTitle?: string
}

export type CustomerGrade = 'A 类' | 'B 类' | 'C 类'

export interface CustomerRow {
  id: string
  /** DB slug for follow-up API */
  slug?: string
  company?: string
  /** contact_name */
  contactName?: string
  /** title_line — list card headline */
  titleLine?: string
  phoneMasked: string
  name: string
  addressHint: string
  demandSummary: string
  grade: CustomerGrade
  /** Pipeline status, e.g. 洽谈中 / 已成交 / 搁置 */
  dealStatus: string
  lastFollowAt: string
  nextReminder: string | '—'
  timelineHtml?: string
  ownerName: string
  hasNextReminderTag?: 'amber' | 'mint'
}

/** Full customer row for detail drawer (includes phone) */
export interface CustomerDetail extends CustomerRow {
  contactName: string
  phone: string
  badgesHtml?: string
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
  summary?: string
  metaLine?: string
}

export interface ViewingRow {
  id?: number
  start: string
  end: string
  propertyRef: string
  customerName: string
  companions: string
  score: string
}

export interface DealRow {
  id?: number
  contractType: string
  amount: string
  commission: string
  invoiceType: string
  archiveStatus: string
}

export interface AnnouncementRow {
  id: number
  title: string
  scope: string
  popup: string
  schedule: string
  status: '已发送' | '计划中'
  statusTone: 'mint' | 'amber'
  body?: string | null
}

export type LogKind = 'prop' | 'cust' | 'acct'
export type LogAction = 'login' | 'view' | 'edit' | 'share' | 'export'

export interface LogRow {
  id?: number
  /** Server-side timestamp for date-range filter */
  loggedAt?: string
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
  /** List column `title` — short headline in property table */
  listTitle: string
  /** Administrative region label (list column `district`) */
  district: string
  /** Primary line under 上架流程 (maps to listing_line1) */
  listingLine1: string
  /** Secondary line (maps to listing_line2) */
  listingLine2: string
  /** List audit badge: 已通过 | 待审核 | — */
  auditTag: AuditTag
  /** Shown in audit queue; persisted as `properties.risk_tag` */
  riskTag?: string
  /** Submitter shown in list */
  submitterName: string
  /** Dim row in admin list */
  rowMuted: boolean
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
