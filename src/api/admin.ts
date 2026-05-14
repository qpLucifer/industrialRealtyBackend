import { http, unwrap } from './http'
import type {
  AnnouncementRow,
  AuditQueueRow,
  AuthUser,
  CustomerDetail,
  CustomerRow,
  DealRow,
  KpiItem,
  LogRow,
  PropertyFullForm,
  PropertyRow,
  RegionBar,
  RegionBindingRow,
  RegionDefRow,
  RegionTreeLine,
  SecuritySwitch,
  StaffActivityRow,
  StaffForm,
  StaffRow,
  SysAdminUserRow,
  VideoFaqRow,
  ViewingRow,
  WhitelistRow,
} from '@/types/domain'

export async function fetchDashboard() {
  const res = await http.get('/dashboard/summary')
  return unwrap(res) as {
    kpis: KpiItem[]
    regionBars: RegionBar[]
    staffActivity: StaffActivityRow[]
  }
}

export async function fetchStaffList(params?: { q?: string; role?: string }) {
  const res = await http.get('/staff/list', {
    params: {
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
      ...(params?.role && params.role !== 'all' ? { role: params.role } : {}),
    },
  })
  return unwrap(res) as { list: StaffRow[] }
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

export async function fetchWhitelist() {
  const res = await http.get('/whitelist')
  return unwrap(res) as { list: WhitelistRow[] }
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

export async function fetchRegionDefs() {
  const res = await http.get('/regions/defs')
  return unwrap(res) as { list: RegionDefRow[] }
}

export async function postRegionDef(name: string) {
  const res = await http.post('/regions/defs', { name })
  return unwrap(res) as { success: boolean; id: number; name: string }
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

export async function fetchProperties(params?: { type?: string; status?: string; district?: string; q?: string }) {
  const res = await http.get('/properties', {
    params: {
      ...(params?.type && params.type !== 'all' ? { type: params.type } : {}),
      ...(params?.district && params.district !== 'all' ? { district: params.district } : {}),
      ...(params?.status && params.status !== 'all' ? { status: params.status } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
    },
  })
  return unwrap(res) as { list: PropertyRow[] }
}

export async function fetchPropertyDetail(code: string) {
  const res = await http.get('/property/detail', { params: { code } })
  return unwrap(res) as PropertyFullForm
}

export async function savePropertySnapshot(payload: unknown) {
  const res = await http.post('/properties/snapshot', payload)
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

export async function postPropertiesBulkFollow(codes: string[], actor?: string) {
  const res = await http.post('/properties/bulk-follow', { codes, actor })
  return unwrap(res) as { success: boolean; count: number }
}

export async function uploadOssFile(file: File, folder?: string) {
  const fd = new FormData()
  fd.append('file', file)
  if (folder) fd.append('folder', folder)
  const res = await http.post('/upload/oss', fd)
  return unwrap(res) as { url: string; key: string }
}

export async function fetchAuditQueue() {
  const res = await http.get('/audit/queue')
  return unwrap(res) as { list: AuditQueueRow[] }
}

export async function auditPassApi(payload: { code: string }) {
  const res = await http.post('/audit/pass', payload)
  return unwrap(res) as { success: boolean }
}

export async function auditRejectApi(payload: { code: string; reason: string }) {
  const res = await http.post('/audit/reject', payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchCustomers(params?: { grade?: string; scope?: string; deal?: string; q?: string }) {
  const res = await http.get('/customers', {
    params: {
      ...(params?.grade && params.grade !== 'all' ? { grade: params.grade } : {}),
      ...(params?.scope && params.scope !== 'all' ? { scope: params.scope } : {}),
      ...(params?.deal && params.deal !== 'all' ? { deal: params.deal } : {}),
      ...(params?.q?.trim() ? { q: params.q.trim() } : {}),
    },
  })
  return unwrap(res) as { list: CustomerRow[] }
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

export async function fetchVideoFaq() {
  const res = await http.get('/video-faq')
  return unwrap(res) as { list: VideoFaqRow[] }
}

export async function createVideoFaqRow(payload: Partial<VideoFaqRow> & { metaLine?: string; summary?: string }) {
  const res = await http.post('/video-faq', payload)
  return unwrap(res) as { success: boolean; id: string }
}

export async function updateVideoFaqRow(id: string, payload: Partial<VideoFaqRow> & { metaLine?: string; summary?: string }) {
  const res = await http.put(`/video-faq/${encodeURIComponent(id)}`, payload)
  return unwrap(res) as { success: boolean }
}

export async function deleteVideoFaqRow(id: string) {
  const res = await http.delete(`/video-faq/${encodeURIComponent(id)}`)
  return unwrap(res) as { success: boolean }
}

export async function fetchViewingsSummary() {
  const res = await http.get('/viewings/summary')
  return unwrap(res) as { viewings: ViewingRow[]; deals: DealRow[] }
}

export async function createViewingApi(payload: Record<string, unknown>) {
  const res = await http.post('/viewings', payload)
  return unwrap(res) as { success: boolean; id: number }
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

export async function fetchAnnouncements() {
  const res = await http.get('/announcements')
  return unwrap(res) as { list: AnnouncementRow[] }
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

export async function fetchLogs(params?: { kind?: string; action?: string; q?: string; dateFrom?: string; dateTo?: string }) {
  const res = await http.get('/logs', { params })
  return unwrap(res) as { list: LogRow[] }
}

export async function fetchSecuritySettings() {
  const res = await http.get('/settings/security')
  return unwrap(res) as { switches: SecuritySwitch[] }
}

export async function putSecuritySettings(switches: SecuritySwitch[]) {
  const res = await http.put('/settings/security', { switches })
  return unwrap(res) as { switches: SecuritySwitch[] }
}

export async function fetchSysAdminUsers() {
  const res = await http.get('/sys-admin-users')
  return unwrap(res) as { list: SysAdminUserRow[] }
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
