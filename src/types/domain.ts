/** Frontend domain types — aligned with mock/data for future OpenAPI / DB */

export interface AuthUser {
  displayName: string
  roleLine: string
  avatarUrl?: string
  /** ISO8601 — session expiry from token (see /api/me) */
  sessionExpiresAt?: string
  /** Seconds remaining for this session */
  sessionExpiresIn?: number
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

export type StaffStatus = string
export type StaffAccountStatus = string

export interface StaffRow {
  id: string
  employeeNo: string
  name: string
  phoneMasked: string
  /** Department label (list + CSV) */
  department: string
  /** Job title / 职位 (list + CSV) */
  title: string
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
  /** region_defs.id */
  regionIds: number[]
  dataScopeHint: string
  remark: string
}

/** Staff × property grant for mini property privacy fields */
export interface PropertyPrivacyGrantRow {
  id: number
  staffId: string
  staffName: string
  employeeNo: string
  propertyId: string
  propertyCode: string
  propertyTitle: string
  canViewPrivacy: boolean
  remark: string
  updatedBy?: string | null
  updatedAt?: string | null
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

/** Master list of business region names — CRUD on 区域名称 page */
export interface RegionDefRow {
  id: number
  name: string
  sortOrder?: number
}

export type PropertyStatusTag =
  | '草稿'
  | '待审核'
  | '驳回'
  | '待租'
  | '已租'
  | '待售'
  | '已售'
  | '待租售'
  | '意向中'
  | '下架封存'

/** Legacy list column; workflow merged into `status` — kept optional for older responses */
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
  district?: string
  districtRegionId?: number | null
  demandSummary: string
  grade: CustomerGrade
  /** Pipeline status, e.g. 洽谈中 / 已成交 / 搁置 */
  dealStatus: string
  lastFollowAt: string
  nextReminder: string | '—'
  timelineHtml?: string
  /** Raw follow-up lines from API (preferred over timelineHtml for display) */
  timelineJson?: string[]
  ownerName: string
  /** Private pool — staff.id list */
  ownerStaffIds?: string[]
  hasNextReminderTag?: 'amber' | 'mint'
  /** Shown on mini-program customer list when true (DB list_on_mini, default true) */
  listOnMini?: boolean
  /** 公有 / 私有 — from badges_html */
  badgesHtml?: string
  nextReminderAt?: string | null
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
}

export interface ViewingRow {
  id?: number
  start: string
  end: string
  /** properties.id */
  propertyId?: string | null
  /** Denormalized property code / label */
  propertyRef: string
  /** Resolved from property_id when property_ref empty */
  propertyTitle?: string | null
  miniPropCode?: string | null
  customerName: string
  /** Customer row slug when chosen from CRM */
  customerSlug?: string | null
  /** Denormalized display names */
  companions: string
  /** Staff ids for companions */
  companionStaffIds?: string[]
  score: string
  miniStaffId?: string | null
  miniStaff?: string | null
  active?: boolean
}

export interface DealRow {
  id?: number
  contractType: string
  amount: string
  commission: string
  invoiceType: string
  archiveStatus: string
  /** staff.id — required for new deals */
  staffId?: string | null
  staffName?: string | null
  recordedAt?: string | null
}

/** Admin code dictionary — `type_code` whitelist on server */
export interface CodeMasterTypeInfo {
  typeCode: string
  typeName: string
}

export interface CodeMasterRow {
  id: number
  typeCode: string
  itemCode: string
  label: string
  sortOrder: number
  /** MySQL TINYINT may deserialize as 0/1 */
  isActive: boolean | number
  remark: string | null
}

export interface AnnouncementRow {
  id: number
  title: string
  scope: string
  popup: string
  /** When popup is 是: MySQL DATETIME formatted as YYYY-MM-DDTHH:mm for datetime-local */
  popupStart?: string | null
  popupEnd?: string | null
  status: string
  statusTone: 'mint' | 'amber'
  body?: string | null
}

export type LandAuctionStatus = 'upcoming' | 'auctioning' | 'completed'

export interface LandAuctionRow {
  id: number
  title: string
  districtRegionId: number | null
  region: string
  areaMu: number | null
  startPriceWan: number | null
  dealPriceWan: number | null
  auctionStatus: LandAuctionStatus
  listingDate: string
  auctionStartAt: string
  auctionEndAt: string
  completedAt: string
  remark: string
  published: boolean
  sortOrder: number
  updatedAt?: string
}

export interface LandAuctionStats {
  upcoming: number
  auctioning: number
  completed: number
  total: number
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
  /** Deprecated — workflow merged into status_tag / externalStatus; always "—" from API */
  auditTag: AuditTag
  /** DB audit_state: draft | pending | rejected | live */
  auditState?: string
  /** Rejection reason or audit narrative from DB `audit_hint` */
  auditHint?: string
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
  /** Newline-separated image URLs (preferred over parsing mediaUrls) */
  mediaImageUrls?: string
  /** Newline-separated video URLs (any URL shape; not inferred from extension only) */
  mediaVideoUrls?: string
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
