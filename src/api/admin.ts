import { http, unwrap } from './http'
import type {
  AnnouncementRow,
  AuditQueueRow,
  AuthUser,
  CustomerRow,
  DealRow,
  KpiItem,
  LogRow,
  PropertyFullForm,
  PropertyRow,
  RegionBar,
  RegionBindingRow,
  RegionTreeLine,
  SecuritySwitch,
  StaffActivityRow,
  StaffForm,
  StaffRow,
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

export async function fetchStaffList() {
  const res = await http.get('/staff/list')
  return unwrap(res) as { list: StaffRow[] }
}

export async function fetchStaffForm() {
  const res = await http.get('/staff/form')
  return unwrap(res) as StaffForm
}

export async function saveStaffForm(_payload: StaffForm) {
  const res = await http.post('/staff/save', _payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchWhitelist() {
  const res = await http.get('/whitelist')
  return unwrap(res) as { list: WhitelistRow[] }
}

export async function fetchRegionTree() {
  const res = await http.get('/regions/tree')
  return unwrap(res) as { lines: RegionTreeLine[] }
}

export async function fetchRegionBindings() {
  const res = await http.get('/regions/bindings')
  return unwrap(res) as { list: RegionBindingRow[] }
}

export async function fetchProperties() {
  const res = await http.get('/properties')
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

export async function fetchAuditQueue() {
  const res = await http.get('/audit/queue')
  return unwrap(res) as { list: AuditQueueRow[] }
}

export async function auditPassApi(payload: { code: string }) {
  const res = await http.post('/audit/pass', payload)
  return unwrap(res) as { success: boolean }
}

export async function auditRejectApi(payload: { code: string }) {
  const res = await http.post('/audit/reject', payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchCustomers() {
  const res = await http.get('/customers')
  return unwrap(res) as { list: CustomerRow[] }
}

export async function postCustomerFollowUp(_payload: Record<string, unknown>) {
  const res = await http.post('/customers/follow-up', _payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchVideoFaq() {
  const res = await http.get('/video-faq')
  return unwrap(res) as { list: VideoFaqRow[] }
}

export async function fetchViewingsSummary() {
  const res = await http.get('/viewings/summary')
  return unwrap(res) as { viewings: ViewingRow[]; deals: DealRow[] }
}

export async function fetchAnnouncements() {
  const res = await http.get('/announcements')
  return unwrap(res) as { list: AnnouncementRow[] }
}

export async function publishAnnouncement(_payload: Record<string, unknown>) {
  const res = await http.post('/announcements/publish', _payload)
  return unwrap(res) as { success: boolean }
}

export async function fetchLogs() {
  const res = await http.get('/logs')
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

export async function fetchFutureEndpoints() {
  const res = await http.get('/future/endpoints')
  return unwrap(res) as { list: { method: string; path: string; desc: string }[] }
}

export type { AuthUser }
