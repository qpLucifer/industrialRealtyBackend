import { popUploadLoading, pushUploadLoading } from '@/lib/uploadOssLoading'
import { http, unwrap } from './http'
import type {
  AnnouncementRow,
  AuditQueueRow,
  AuthUser,
  CodeMasterRow,
  CodeMasterTypeInfo,
  CustomerDetail,
  CustomerRow,
  DealRow,
  LandAuctionRow,
  LandAuctionStats,
  LogRow,
  PropertyFullForm,
  PropertyPrivacyGrantRow,
  PropertyLogEntry,
  PropertyRow,
  RegionBindingRow,
  RegionDefRow,
  RegionTreeLine,
  SecuritySwitch,
  DashboardSummary,
  StaffForm,
  StaffRow,
  SysAdminUserRow,
  VideoFaqRow,
  ViewingRow,
  WhitelistRow,
} from '@/types/domain'

export async function fetchDashboard() {
  const res = await http.get('/dashboard/summary')
  return unwrap(res) as DashboardSummary
}

export type PagedList<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

function listPageParams(params?: { page?: number; pageSize?: number; all?: boolean }) {
  if (params?.all) return { all: '1' as const }
  return { page: params?.page ?? 1, pageSize: params?.pageSize ?? 10 }
}

export async function fetchStaffList(params?: { q?: string; page?: number; pageSize?: number; all?: boolean }) {
  const res = await http.get('/staff/list', {
    params: {
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...listPageParams(params),
    },
  })
  return unwrap(res) as PagedList<StaffRow>
}

export async function fetchStaffForm(staffId?: string) {
  const res = await http.get('/staff/form', { params: staffId ? { id: staffId } : undefined })
  return unwrap(res) as StaffForm
}

export async function saveStaffForm(_payload: StaffForm) {
  const res = await http.post('/staff/save', _payload)
  return unwrap(res) as { success: boolean; id?: string }
}

export async function deleteStaffApi(id: string) {
  const res = await http.delete(`/staff/${encodeURIComponent(id)}`)
  return unwrap(res) as { success: boolean }
}

export async function patchStaffStatusApi(id: string, status: string) {
  const res = await http.patch(`/staff/${encodeURIComponent(id)}/status`, { status })
  return unwrap(res) as { success: boolean }
}

export async function fetchWhitelist(params?: { page?: number; pageSize?: number }) {
  const res = await http.get('/whitelist', { params: listPageParams(params) })
  return unwrap(res) as PagedList<WhitelistRow>
}

export async function createWhitelistRow(payload: Omit<WhitelistRow, 'id'>) {
  const res = await http.post('/whitelist', payload)
  return unwrap(res) as { success: boolean; id: number }
}

export async function updateWhitelistRow(id: number, payload: Partial<WhitelistRow>) {
  const res = await http.put(`/whitelist/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteWhitelistRow(id: number) {
  const res = await http.delete(`/whitelist/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchPropertyPrivacyGrants(params?: {
  q?: string
  staffId?: string
  propertyId?: string
  page?: number
  pageSize?: number
}) {
  const res = await http.get('/property-privacy/grants', {
    params: {
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params?.staffId ? { staffId: params.staffId } : {}),
      ...(params?.propertyId ? { propertyId: params.propertyId } : {}),
      ...listPageParams(params),
    },
  })
  return unwrap(res) as PagedList<PropertyPrivacyGrantRow>
}

export type PropertyPrivacyGrantSavePayload = {
  canViewPrivacy: boolean
  canEditProperty?: boolean
  remark?: string
} & (
  | {
      staffId: string
      propertyId: string
    }
  | {
      staffIds: string[]
      propertyIds?: string[]
      propertyAll?: boolean
    }
)

export async function savePropertyPrivacyGrant(payload: PropertyPrivacyGrantSavePayload) {
  const res = await http.post('/property-privacy/grants', payload)
  return unwrap(res) as
    | { success: boolean; id: number; created: boolean }
    | {
        success: boolean
        created: number
        updated: number
        total: number
        staffCount: number
        propertyCount: number
      }
}

export async function patchPropertyPrivacyGrant(
  id: number,
  payload: Partial<Pick<PropertyPrivacyGrantRow, 'canViewPrivacy' | 'canEditProperty' | 'remark'>>,
) {
  const res = await http.put(`/property-privacy/grants/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deletePropertyPrivacyGrant(id: number) {
  const res = await http.delete(`/property-privacy/grants/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function clearPropertyPrivacyGrants(payload: {
  staffIds?: string[]
  staffAll?: boolean
}) {
  const res = await http.post('/property-privacy/grants/clear', payload)
  return unwrap(res) as {
    success: boolean
    deleted: number
    staffAll?: boolean
    staffCount?: number
  }
}

/** @deprecated Use clearPropertyPrivacyGrants({ staffAll: true }) */
export async function deleteAllPropertyPrivacyGrants() {
  const res = await http.delete('/property-privacy/grants/all')
  return unwrap(res) as { success: boolean; deleted: number }
}

export async function fetchRegionDefs(params?: { page?: number; pageSize?: number; all?: boolean }) {
  const res = await http.get('/regions/defs', {
    params: params?.all ? { all: '1' } : listPageParams(params),
  })
  return unwrap(res) as PagedList<RegionDefRow>
}

export async function postRegionDef(name: string) {
  const res = await http.post('/regions/defs', { name })
  return unwrap(res) as { success: boolean; id: number; name: string }
}

export async function repairRegionDefLabels() {
  const res = await http.post('/regions/defs/repair-labels')
  return unwrap(res) as { ok: boolean; rowsTouched: number; regionCount: number }
}

export async function putRegionDef(id: number, name: string) {
  const res = await http.put(`/regions/defs/${id}`, { name })
  return unwrap(res) as { success: boolean; id: number; name: string }
}

export async function deleteRegionDef(id: number) {
  const res = await http.delete(`/regions/defs/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchRegionTree() {
  const res = await http.get('/regions/tree')
  return unwrap(res) as { lines: RegionTreeLine[] }
}

export async function fetchRegionBindings() {
  const res = await http.get('/regions/bindings')
  return unwrap(res) as { list: RegionBindingRow[] }
}

export async function saveRegionTree(lines: RegionTreeLine[]) {
  const res = await http.put('/regions/tree', { lines })
  return unwrap(res) as { success: boolean }
}

export async function saveRegionBindings(list: RegionBindingRow[]) {
  const res = await http.put('/regions/bindings', { list })
  return unwrap(res) as { success: boolean }
}

export async function fetchProperties(params?: {
  type?: string
  status?: string
  district?: string
  q?: string
  page?: number
  pageSize?: number
  all?: boolean
}) {
  const res = await http.get('/properties', {
    params: {
      ...(params?.type && params.type !== 'all' ? { type: params.type } : {}),
      ...(params?.district && params.district !== 'all' ? { district: params.district } : {}),
      ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...listPageParams(params),
    },
  })
  return unwrap(res) as PagedList<PropertyRow>
}

export async function fetchPropertyDetail(code: string) {
  const res = await http.get('/property/detail', { params: { code } })
  return unwrap(res) as PropertyFullForm
}

export async function fetchPropertyLogs(code: string) {
  const res = await http.get('/property/logs', { params: { code } })
  return unwrap(res) as { list: PropertyLogEntry[] }
}

export async function postPropertyFollowUp(payload: Record<string, unknown>) {
  const res = await http.post('/property/follow-up', payload)
  return unwrap(res) as { success: boolean }
}

export async function savePropertySnapshot(payload: unknown) {
  const res = await http.post('/properties/snapshot', payload)
  return unwrap(res) as { success: boolean }
}

export async function publishPropertyApi(payload: { code: string }) {
  const res = await http.post('/properties/publish', payload)
  return unwrap(res) as { success: boolean }
}

export async function createPropertyDraft(payload?: { submitterName?: string }) {
  const res = await http.post('/properties', payload ?? {})
  return unwrap(res) as { code: string }
}

export async function deletePropertyApi(code: string) {
  const res = await http.delete(`/properties/${encodeURIComponent(code)}`)
  return unwrap(res) as { success: boolean }
}

/** @deprecated Use uploadImageFile / uploadImagesBatch / uploadVideoMultipart from @/lib/mediaUpload */
export async function uploadOssFile(file: File, folder?: string) {
  const { uploadImageFile } = await import('@/lib/mediaUpload')
  pushUploadLoading()
  try {
    return await uploadImageFile(file, folder)
  } finally {
    popUploadLoading()
  }
}

export async function fetchAuditQueue(params?: { page?: number; pageSize?: number }) {
  const res = await http.get('/audit/queue', { params: listPageParams(params) })
  return unwrap(res) as PagedList<AuditQueueRow>
}

export async function auditPassApi(payload: { code: string }) {
  const res = await http.post('/audit/pass', payload)
  return unwrap(res) as { success: boolean }
}

export async function auditRejectApi(payload: { code: string; reason: string }) {
  const res = await http.post('/audit/reject', payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchCustomers(params?: {
  grade?: string
  scope?: string
  deal?: string
  q?: string
  districtRegionId?: number | null
  reminder?: 'today' | ''
  page?: number
  pageSize?: number
  all?: boolean
}) {
  const res = await http.get('/customers', {
    params: {
      ...(params?.grade && params.grade !== 'all' ? { grade: params.grade } : {}),
      ...(params?.scope && params.scope !== 'all' ? { scope: params.scope } : {}),
      ...(params?.deal && params.deal !== 'all' ? { deal: params.deal } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params?.districtRegionId != null && params.districtRegionId > 0
        ? { districtRegionId: params.districtRegionId }
        : {}),
      ...(params?.reminder === 'today' ? { reminder: 'today' } : {}),
      ...listPageParams(params),
    },
  })
  return unwrap(res) as PagedList<CustomerRow>
}

export async function fetchCustomerDetail(slug: string) {
  const res = await http.get(`/customers/${encodeURIComponent(slug)}`)
  return unwrap(res) as CustomerDetail
}

export async function postCustomer(payload: Record<string, unknown>) {
  const res = await http.post('/customers', payload)
  return unwrap(res) as { success: boolean; slug: string; adminId?: string }
}

export async function deleteCustomerBySlug(slug: string) {
  const res = await http.delete(`/customers/${encodeURIComponent(slug)}`)
  return unwrap(res) as { success: boolean }
}

export async function postCustomerFollowUp(_payload: Record<string, unknown>) {
  const res = await http.post('/customers/follow-up', _payload)
  return unwrap(res) as { success: boolean }
}

export async function putCustomerApi(slug: string, payload: Record<string, unknown>) {
  const res = await http.put(`/customers/${encodeURIComponent(slug)}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchVideoFaq(params?: { page?: number; pageSize?: number }) {
  const res = await http.get('/video-faq', { params: listPageParams(params) })
  return unwrap(res) as PagedList<VideoFaqRow>
}

export async function createVideoFaqRow(payload: Partial<VideoFaqRow> & { summary?: string }) {
  const res = await http.post('/video-faq', payload)
  return unwrap(res) as { success: boolean; id: string }
}

export async function updateVideoFaqRow(id: string, payload: Partial<VideoFaqRow> & { summary?: string }) {
  const res = await http.put(`/video-faq/${encodeURIComponent(id)}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteVideoFaqRow(id: string) {
  const res = await http.delete(`/video-faq/${encodeURIComponent(id)}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchViewingsSummary(params?: {
  viewingPage?: number
  viewingPageSize?: number
  dealPage?: number
  dealPageSize?: number
}) {
  const res = await http.get('/viewings/summary', {
    params: {
      viewingPage: params?.viewingPage ?? 1,
      viewingPageSize: params?.viewingPageSize ?? 10,
      dealPage: params?.dealPage ?? 1,
      dealPageSize: params?.dealPageSize ?? 10,
    },
  })
  return unwrap(res) as {
    viewings: ViewingRow[]
    viewingsTotal: number
    viewingsPage: number
    viewingsPageSize: number
    viewingsHasMore: boolean
    deals: DealRow[]
    dealsTotal: number
    dealsPage: number
    dealsPageSize: number
    dealsHasMore: boolean
  }
}

export async function createViewingApi(payload: Record<string, unknown>) {
  const res = await http.post('/viewings', payload)
  return unwrap(res) as { success: boolean; id: number; ids?: number[]; count?: number }
}

export async function updateViewingApi(id: number, payload: Record<string, unknown>) {
  const res = await http.put(`/viewings/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteViewingApi(id: number) {
  const res = await http.delete(`/viewings/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function createDealApi(payload: Record<string, unknown>) {
  const res = await http.post('/deals', payload)
  return unwrap(res) as { success: boolean; id: number }
}

export async function updateDealApi(id: number, payload: Record<string, unknown>) {
  const res = await http.put(`/deals/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteDealApi(id: number) {
  const res = await http.delete(`/deals/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchAnnouncements(params?: { page?: number; pageSize?: number }) {
  const res = await http.get('/announcements', { params: listPageParams(params) })
  return unwrap(res) as PagedList<AnnouncementRow>
}

export async function publishAnnouncement(_payload: Record<string, unknown>) {
  const res = await http.post('/announcements/publish', _payload)
  return unwrap(res) as { success: boolean }
}

export async function updateAnnouncementApi(id: number, payload: Record<string, unknown>) {
  const res = await http.put(`/announcements/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteAnnouncementApi(id: number) {
  const res = await http.delete(`/announcements/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchLandAuctionStats(params?: { districtRegionId?: number | null }) {
  const res = await http.get('/land-auctions/stats', {
    params:
      params?.districtRegionId != null && params.districtRegionId > 0
        ? { districtRegionId: params.districtRegionId }
        : undefined,
  })
  return unwrap(res) as { stats: LandAuctionStats }
}

export async function fetchLandAuctions(params?: {
  page?: number
  pageSize?: number
  status?: string
  q?: string
  districtRegionId?: number | null
}) {
  const res = await http.get('/land-auctions', {
    params: {
      ...listPageParams(params),
      ...(params?.status?.trim() ? { status: params.status.trim() } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params?.districtRegionId != null && params.districtRegionId > 0
        ? { districtRegionId: params.districtRegionId }
        : {}),
    },
  })
  return unwrap(res) as PagedList<LandAuctionRow>
}

export async function createLandAuctionApi(payload: Record<string, unknown>) {
  const res = await http.post('/land-auctions', payload)
  return unwrap(res) as { success: boolean; id?: number }
}

export async function updateLandAuctionApi(id: number, payload: Record<string, unknown>) {
  const res = await http.put(`/land-auctions/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteLandAuctionApi(id: number) {
  const res = await http.delete(`/land-auctions/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchCodeMasterTypes() {
  const res = await http.get('/code-master/types')
  return unwrap(res) as { list: CodeMasterTypeInfo[] }
}

export async function fetchCodeMasterItems(
  type: string,
  opts?: { includeInactive?: boolean; page?: number; pageSize?: number },
) {
  const res = await http.get('/code-master', {
    params: {
      type,
      ...(opts?.includeInactive ? { includeInactive: '1' } : {}),
      ...listPageParams(opts),
    },
  })
  return unwrap(res) as PagedList<CodeMasterRow>
}

export async function createCodeMasterItem(payload: {
  typeCode: string
  itemCode: string
  label: string
  sortOrder?: number
  isActive?: boolean
  remark?: string | null
}) {
  const res = await http.post('/code-master', payload)
  return unwrap(res) as { success: boolean }
}

export async function updateCodeMasterItem(
  id: number,
  payload: {
    typeCode: string
    itemCode: string
    label: string
    sortOrder?: number
    isActive?: boolean
    remark?: string | null
  },
) {
  const res = await http.put(`/code-master/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteCodeMasterItem(id: number) {
  const res = await http.delete(`/code-master/${id}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchLogs(params?: {
  kind?: string
  action?: string
  actor?: string
  q?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const res = await http.get('/logs', {
    params: {
      ...(params?.kind ? { kind: params.kind } : {}),
      ...(params?.action ? { action: params.action } : {}),
      ...(params?.actor?.trim() ? { actor: params.actor.trim() } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params?.dateFrom ? { dateFrom: params.dateFrom } : {}),
      ...(params?.dateTo ? { dateTo: params.dateTo } : {}),
      ...listPageParams(params),
    },
  })
  return unwrap(res) as PagedList<LogRow>
}

/** Download CSV export for current log filters (max 10k rows on server). */
export async function exportLogsCsv(params: {
  actor: string
  withinDays: number
  kind?: string
  action?: string
  q?: string
  dateFrom?: string
  dateTo?: string
}) {
  const res = await http.get('/logs/export', {
    params: {
      actor: params.actor.trim(),
      withinDays: params.withinDays,
      ...(params.kind ? { kind: params.kind } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
      ...(params.dateTo ? { dateTo: params.dateTo } : {}),
    },
    responseType: 'blob',
  })
  return res.data as Blob
}

export async function fetchLogsCount(params?: {
  kind?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  olderThanDays?: number
}) {
  const res = await http.get('/logs/count', { params })
  return unwrap(res) as { count: number }
}

export async function purgeLogs(body: {
  olderThanDays?: number
  kind?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}) {
  const res = await http.post('/logs/purge', body)
  return unwrap(res) as { deleted: number; matchedBefore: number }
}

export async function fetchSecuritySettings() {
  const res = await http.get('/settings/security')
  return unwrap(res) as { switches: SecuritySwitch[] }
}

export async function putSecuritySettings(switches: SecuritySwitch[]) {
  const res = await http.put('/settings/security', { switches })
  return unwrap(res) as { switches: SecuritySwitch[] }
}

export async function fetchSysAdminUsers(params?: { page?: number; pageSize?: number }) {
  const res = await http.get('/sys-admin-users', { params: listPageParams(params) })
  return unwrap(res) as PagedList<SysAdminUserRow>
}

export async function createSysAdminUser(payload: {
  username: string
  password: string
  displayName: string
  roleLine: string
  avatarUrl?: string | null
}) {
  const res = await http.post('/sys-admin-users', payload)
  return unwrap(res) as { success: boolean; id: number }
}

export async function updateSysAdminUser(
  id: number,
  payload: {
    username?: string
    displayName?: string
    roleLine?: string
    avatarUrl?: string | null
    password?: string
    currentPassword?: string
  },
) {
  const res = await http.put(`/sys-admin-users/${id}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteSysAdminUser(id: number, currentPassword?: string) {
  const res = await http.delete(`/sys-admin-users/${id}`, { data: { currentPassword: currentPassword ?? '' } })
  return unwrap(res) as { success: boolean }
}

export async function postStaffImportCsv(text: string) {
  const res = await http.post('/staff/import-csv', { text })
  return unwrap(res) as { created: number; updated: number; errors: string[] }
}

export async function fetchFutureEndpoints() {
  const res = await http.get('/future/endpoints')
  return unwrap(res) as { list: { method: string; path: string; desc: string }[] }
}

export type { AuthUser }
