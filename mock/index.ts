import type { MockMethod } from 'vite-plugin-mock'
import { mockKpis, mockRegionBars, mockStaffActivity, mockPipeline, mockAttention, mockPlatform } from './data/dashboard'
import { mockStaffRows, mockStaffFormDefault } from './data/staff'
import { mockWhitelistRows } from './data/whitelist'
import { mockRegionTreeLines, mockRegionBindings } from './data/regions'
import { mockRegionDefs, mockCreateRegionDef, mockUpdateRegionDef, mockDeleteRegionDef } from './data/regionDefs'
import { mockPropertyRows } from './data/properties'
import { mockAuditQueue } from './data/audit'
import {
  getMockCustomerDetail,
  mockAppendCustomerFollow,
  mockCustomerCreate,
  mockCustomerDelete,
  mockCustomerRows,
  mockCustomerUpdate,
} from './data/customers'
import { mockVideoFaqRows } from './data/videoFaq'
import { mockViewingRows, mockDealRows } from './data/viewings'
import { mockAnnouncements } from './data/announcements'
import {
  MOCK_CODE_MASTER_TYPE_META,
  mockCreateCodeMaster,
  mockDeleteCodeMaster,
  mockListCodeMaster,
  mockUpdateCodeMaster,
} from './data/codeMaster'
import { mockLogs } from './data/logs'
import { mockSecuritySwitches } from './data/settings'
import { mockFutureEndpoints } from './data/future'
import { createDefaultPropertyForm } from './data/propertyForm'
import {
  mockSysAdminUsers,
  mockSysAdminUserCreate,
  mockSysAdminUserUpdate,
  mockSysAdminUserDelete,
  mockTryAdminLogin,
  mockGetAdminUserForMe,
} from './data/sysAdminUsers'
import { encodeMockAdminToken, decodeMockAdminToken } from './lib/mockAdminToken'

const ok = <T,>(result: T) => ({ code: 200, message: 'success', result })

function queryScalar(query: Record<string, string | string[] | undefined> | undefined, key: string) {
  const raw = query?.[key]
  return Array.isArray(raw) ? raw[0] : raw
}

function paginateMockRows<T>(rows: T[], query?: Record<string, string | string[] | undefined>) {
  const all = queryScalar(query, 'all') === '1' || queryScalar(query, 'all') === 'true'
  if (all) {
    return { list: rows, total: rows.length, page: 1, pageSize: rows.length || 1, hasMore: false }
  }
  const page = Math.max(1, Number(queryScalar(query, 'page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(queryScalar(query, 'pageSize')) || 10))
  const total = rows.length
  const start = (page - 1) * pageSize
  const list = rows.slice(start, start + pageSize)
  return { list, total, page, pageSize, hasMore: page * pageSize < total }
}

function paginateMockRowsByKeys<T>(
  rows: T[],
  query: Record<string, string | string[] | undefined> | undefined,
  pageKey: string,
  pageSizeKey: string,
) {
  return paginateMockRows(rows, {
    page: queryScalar(query, pageKey),
    pageSize: queryScalar(query, pageSizeKey),
  })
}

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }: { body?: Record<string, string> }) => {
      const username = String(body?.username || '').trim().toLowerCase()
      const password = String(body?.password || '')
      const r = mockTryAdminLogin(username, password)
      if (!r.ok) {
        return { code: r.code, message: r.message, result: null }
      }
      const { token, expiresAt, expiresIn } = encodeMockAdminToken(r.id)
      return ok({ token, user: r.user, expiresAt, expiresIn })
    },
  },
  {
    url: '/api/me',
    method: 'get',
    response: (opt: { headers?: Record<string, string | string[] | undefined> }) => {
      const h = opt.headers?.authorization ?? opt.headers?.Authorization
      const raw = Array.isArray(h) ? h[0] : h
      const m = raw && String(raw).match(/^Bearer\s+(.+)$/i)
      const token = m ? m[1].trim() : ''
      const dec = decodeMockAdminToken(token)
      if (!dec) {
        return { code: 401, message: '未登录或已过期', result: null }
      }
      const u = mockGetAdminUserForMe(dec.sub)
      if (!u) {
        return { code: 401, message: '用户不存在', result: null }
      }
      return ok({
        ...u,
        sessionExpiresAt: new Date(dec.expMs).toISOString(),
        sessionExpiresIn: Math.max(0, Math.floor((dec.expMs - Date.now()) / 1000)),
      })
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/dashboard/summary',
    method: 'get',
    response: () =>
      ok({
        kpis: mockKpis,
        regionBars: mockRegionBars,
        staffActivity: mockStaffActivity,
        pipeline: mockPipeline,
        attention: mockAttention,
        platform: mockPlatform,
      }),
  },
  {
    url: '/api/staff/list',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const q = String(queryScalar(query, 'q') || '')
        .trim()
        .toLowerCase()
      let rows = [...mockStaffRows]
      if (q) {
        rows = rows.filter((r) => {
          const hay = `${r.name || ''} ${r.phoneMasked || ''} ${r.id || ''} ${r.employeeNo || ''}`.toLowerCase()
          return hay.includes(q)
        })
      }
      return ok(paginateMockRows(rows, query))
    },
  },
  {
    url: '/api/staff/form',
    method: 'get',
    response: () => ok(mockStaffFormDefault),
  },
  {
    url: '/api/whitelist',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockWhitelistRows, query)),
  },
  {
    url: '/api/sys-admin-users',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockSysAdminUsers.map((r) => ({ ...r })), query)),
  },
  {
    url: '/api/sys-admin-users',
    method: 'post',
    response: ({ body }: { body: Record<string, unknown> }) => {
      try {
        const { id } = mockSysAdminUserCreate(body || {})
        return ok({ success: true, id })
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'dup') {
          return { code: 400, message: '登录名已存在', result: null }
        }
        throw e
      }
    },
  },
  {
    url: '/api/sys-admin-users/:id',
    method: 'put',
    response: (opt: { url?: string; body: Record<string, unknown> }) => {
      const m = String(opt.url || '').match(/\/sys-admin-users\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      try {
        mockSysAdminUserUpdate(id, opt.body || {})
        return ok({ success: true })
      } catch {
        return { code: 404, message: '用户不存在', result: null }
      }
    },
  },
  {
    url: '/api/sys-admin-users/:id',
    method: 'delete',
    response: (opt: { url?: string; body?: { currentPassword?: string } }) => {
      const m = String(opt.url || '').match(/\/sys-admin-users\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      try {
        mockSysAdminUserDelete(id)
        return ok({ success: true })
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'last admin') {
          return { code: 400, message: '至少保留一名后台管理员，无法删除', result: null }
        }
        return { code: 404, message: '用户不存在', result: null }
      }
    },
  },
  {
    url: '/api/code-master/types',
    method: 'get',
    response: () =>
      ok({
        list: Object.entries(MOCK_CODE_MASTER_TYPE_META).map(([typeCode, typeName]) => ({ typeCode, typeName })),
      }),
  },
  {
    url: '/api/code-master',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const raw = query?.type
      const type = (Array.isArray(raw) ? raw[0] : raw) || ''
      const inc = query?.includeInactive
      const includeInactive = String(Array.isArray(inc) ? inc[0] : inc || '') === '1'
      try {
        const list = mockListCodeMaster(String(type), Boolean(includeInactive))
        return ok(paginateMockRows(list, query))
      } catch (e: unknown) {
        return { code: 400, message: e instanceof Error ? e.message : 'bad request', result: null }
      }
    },
  },
  {
    url: '/api/code-master',
    method: 'post',
    response: ({ body }: { body: Record<string, unknown> }) => {
      try {
        mockCreateCodeMaster(body || {})
        return ok({ success: true })
      } catch (e: unknown) {
        return { code: 400, message: e instanceof Error ? e.message : 'bad request', result: null }
      }
    },
  },
  {
    url: '/api/code-master/:id',
    method: 'put',
    response: (opt: { url?: string; body: Record<string, unknown> }) => {
      const m = String(opt.url || '').match(/\/code-master\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      try {
        mockUpdateCodeMaster(id, opt.body || {})
        return ok({ success: true })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'bad'
        if (msg === 'not found') return { code: 404, message: 'not found', result: null }
        return { code: 400, message: msg, result: null }
      }
    },
  },
  {
    url: '/api/code-master/:id',
    method: 'delete',
    response: (opt: { url?: string }) => {
      const m = String(opt.url || '').match(/\/code-master\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      try {
        mockDeleteCodeMaster(id)
        return ok({ success: true })
      } catch (e: unknown) {
        return { code: 404, message: e instanceof Error ? e.message : 'not found', result: null }
      }
    },
  },
  {
    url: '/api/regions/defs',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockRegionDefs.map((r) => ({ ...r })), query)),
  },
  {
    url: '/api/regions/defs',
    method: 'post',
    response: ({ body }: { body: { name?: string } }) => {
      const row = mockCreateRegionDef(String(body?.name || ''))
      return ok({ success: true, id: row.id, name: row.name, sortOrder: row.sortOrder })
    },
  },
  {
    url: '/api/regions/defs/:id',
    method: 'put',
    response: (opt: { url?: string; body?: { name?: string } }) => {
      const m = String(opt.url || '').match(/\/defs\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      const row = mockUpdateRegionDef(id, String(opt.body?.name || ''))
      return ok({ success: true, id: row.id, name: row.name })
    },
  },
  {
    url: '/api/regions/defs/:id',
    method: 'delete',
    response: (opt: { url?: string }) => {
      const m = String(opt.url || '').match(/\/defs\/(\d+)/)
      const id = m ? Number(m[1]) : NaN
      mockDeleteRegionDef(id)
      return ok({ success: true })
    },
  },
  {
    url: '/api/regions/tree',
    method: 'get',
    response: () => ok({ lines: mockRegionTreeLines }),
  },
  {
    url: '/api/regions/bindings',
    method: 'get',
    response: () => ok({ list: mockRegionBindings }),
  },
  {
    url: '/api/properties',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const raw = query?.district
      const d = (Array.isArray(raw) ? raw[0] : raw) || 'all'
      let list = [...mockPropertyRows]
      if (d && d !== 'all') {
        list = list.filter((row) => String(row.district || '').includes(String(d)))
      }
      return ok(paginateMockRows(list, query))
    },
  },
  {
    url: '/api/property/detail',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const raw = query?.code
      const code = (Array.isArray(raw) ? raw[0] : raw) || 'P-8821'
      return ok(createDefaultPropertyForm(code))
    },
  },
  {
    url: '/api/property/logs',
    method: 'get',
    response: () =>
      ok({
        list: [
          {
            line: '陈思远 · 写跟进',
            sub: '2026-05-28 15:30 · 现场拍照，客户关注层高（图片×1）',
            kind: 'follow-up',
            occurredAt: '2026-05-28 15:30',
            note: '现场拍照，客户关注层高',
            imageUrls: [],
            audioUrls: [],
            displayLine: '2026-05-28 15:30 · 现场拍照，客户关注层高（图片×1）',
          },
          { line: '陈思远 · 新建草稿', sub: '2026-05-28 10:00', kind: 'action' },
          { line: '陈思远 · 保存', sub: '2026-05-28 10:15 · 黄埔区科学城路 88 号', kind: 'action' },
          { line: '管理员 · 审核通过', sub: '2026-05-28 14:20 · 房源已上架，对外状态为待租', kind: 'action' },
        ],
      }),
  },
  {
    url: '/api/property/follow-up',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/audit/queue',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockAuditQueue, query)),
  },
  {
    url: '/api/customers',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const list = mockCustomerRows.map((r) => ({ ...r }))
      return ok(paginateMockRows(list, query))
    },
  },
  {
    url: '/api/customers/:slug',
    method: 'get',
    response: (opt: { url?: string }) => {
      const m = String(opt.url || '').match(/\/customers\/([^/?]+)/)
      const slug = m ? decodeURIComponent(m[1]) : ''
      const d = getMockCustomerDetail(slug)
      if (!d) return { code: 404, message: 'not found', result: null }
      return ok(d)
    },
  },
  {
    url: '/api/customers',
    method: 'post',
    response: ({ body }: { body: Record<string, unknown> }) => {
      try {
        const out = mockCustomerCreate(body || {})
        return ok({ success: true, ...out })
      } catch (e: unknown) {
        const err = e as { message?: string }
        return { code: 400, message: err?.message || 'create failed', result: null }
      }
    },
  },
  {
    url: '/api/customers/:slug',
    method: 'put',
    response: (opt: { url?: string; body: Record<string, unknown> }) => {
      const m = String(opt.url || '').match(/\/customers\/([^/?]+)/)
      const slug = m ? decodeURIComponent(m[1]) : ''
      mockCustomerUpdate(slug, opt.body || {})
      return ok({ success: true })
    },
  },
  {
    url: '/api/customers/:slug',
    method: 'delete',
    response: (opt: { url?: string }) => {
      const m = String(opt.url || '').match(/\/customers\/([^/?]+)/)
      const slug = m ? decodeURIComponent(m[1]) : ''
      mockCustomerDelete(slug)
      return ok({ success: true })
    },
  },
  {
    url: '/api/video-faq',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockVideoFaqRows, query)),
  },
  {
    url: '/api/viewings/summary',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      const vp = paginateMockRowsByKeys(mockViewingRows, query, 'viewingPage', 'viewingPageSize')
      const dp = paginateMockRowsByKeys(mockDealRows, query, 'dealPage', 'dealPageSize')
      return ok({
        viewings: vp.list,
        viewingsTotal: vp.total,
        viewingsPage: vp.page,
        viewingsPageSize: vp.pageSize,
        viewingsHasMore: vp.hasMore,
        deals: dp.list,
        dealsTotal: dp.total,
        dealsPage: dp.page,
        dealsPageSize: dp.pageSize,
        dealsHasMore: dp.hasMore,
      })
    },
  },
  {
    url: '/api/announcements',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) =>
      ok(paginateMockRows(mockAnnouncements, query)),
  },
  {
    url: '/api/logs',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[] | undefined> }) => {
      let rows = mockLogs.filter(() => true)
      const k = queryScalar(query, 'kind')
      const a = queryScalar(query, 'action')
      if (k && k !== 'all') rows = rows.filter((r) => r.kind === k)
      if (a && a !== 'all') rows = rows.filter((r) => r.action === a)
      const q = String(queryScalar(query, 'q') || '')
        .trim()
        .toLowerCase()
      if (q) {
        rows = rows.filter((r) =>
          `${r.actor || ''} ${r.objectLabel || ''} ${r.detail || ''} ${r.actionLabel || ''}`
            .toLowerCase()
            .includes(q),
        )
      }
      return ok(paginateMockRows(rows, query))
    },
  },
  {
    url: '/api/logs/count',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      let rows = mockLogs.filter(() => true)
      const k = query?.kind
      const a = query?.action
      if (k && k !== 'all') rows = rows.filter((r) => r.kind === k)
      if (a && a !== 'all') rows = rows.filter((r) => r.action === a)
      if (query?.olderThanDays) {
        return ok({ count: rows.length })
      }
      return ok({ count: rows.length })
    },
  },
  {
    url: '/api/logs/purge',
    method: 'post',
    response: ({ body }: { body?: Record<string, unknown> }) => {
      if (body?.olderThanDays != null) {
        const n = mockLogs.length
        mockLogs.splice(0, n)
        return ok({ deleted: n, matchedBefore: n })
      }
      const kind = body?.kind as string | undefined
      const action = body?.action as string | undefined
      const df = body?.dateFrom != null ? String(body.dateFrom).trim() : ''
      const dt = body?.dateTo != null ? String(body.dateTo).trim() : ''
      const hasNarrow =
        (kind && kind !== 'all') || (action && action !== 'all') || Boolean(df) || Boolean(dt)
      if (!hasNarrow) {
        return { code: 400, message: '请至少收窄筛选条件或使用保留天数清理', result: null }
      }
      let removed = 0
      let matched = 0
      for (let i = mockLogs.length - 1; i >= 0; i--) {
        const r = mockLogs[i]
        if (kind && kind !== 'all' && r.kind !== kind) continue
        if (action && action !== 'all' && r.action !== action) continue
        matched++
        mockLogs.splice(i, 1)
        removed++
      }
      return ok({ deleted: removed, matchedBefore: matched })
    },
  },
  {
    url: '/api/settings/security',
    method: 'get',
    response: () => ok({ switches: mockSecuritySwitches }),
  },
  {
    url: '/api/settings/security',
    method: 'put',
    response: ({ body }: { body: { switches?: typeof mockSecuritySwitches } }) =>
      ok({
        switches: body.switches ?? mockSecuritySwitches,
      }),
  },
  {
    url: '/api/future/endpoints',
    method: 'get',
    response: () => ok({ list: mockFutureEndpoints }),
  },
  {
    url: '/api/audit/pass',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/upload/oss',
    method: 'post',
    response: () => ok({ url: 'https://example.com/mock-oss/object.jpg', key: 'mock/object.jpg' }),
  },
  {
    url: '/api/upload/limits',
    method: 'get',
    response: () =>
      ok({
        maxImageBytes: 50 * 1024 * 1024,
        maxVideoBytes: 500 * 1024 * 1024,
        maxImagesPerPick: 5,
        maxVideosPerPick: 1,
        multipartChunkBytes: 5 * 1024 * 1024,
      }),
  },
  {
    url: '/api/upload/oss/multipart/init',
    method: 'post',
    response: () => ok({ sessionId: 'mock', chunkSize: 5242880, totalParts: 1 }),
  },
  {
    url: '/api/upload/oss/multipart/part',
    method: 'post',
    response: () => ok({ partNumber: 1, receivedParts: 1, uploadedBytes: 1, totalBytes: 1 }),
  },
  {
    url: '/api/upload/oss/multipart/complete',
    method: 'post',
    response: () => ok({ url: 'https://example.com/mock-oss/video.mp4', key: 'mock/video.mp4' }),
  },
  {
    url: '/api/staff/import-csv',
    method: 'post',
    response: () => ok({ created: 0, updated: 0, errors: [] }),
  },
  {
    url: '/api/audit/reject',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/staff/save',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/announcements/publish',
    method: 'post',
    response: () => ok({ success: true }),
  },
  {
    url: '/api/customers/follow-up',
    method: 'post',
    response: ({ body }: { body: Record<string, string> }) => {
      const slug = String(body.slug || body.customerId || 'zhangchen')
      const note = String(body.note || '')
      const occurredAt = String(body.occurredAt || '').replace('T', ' ')
      const line = `${occurredAt} · ${note}`
      const short = occurredAt.slice(0, 16)
      mockAppendCustomerFollow(slug, line, short)
      return ok({ success: true })
    },
  },
  {
    url: '/api/properties/snapshot',
    method: 'post',
    response: () => ok({ success: true }),
  },
] as MockMethod[]
