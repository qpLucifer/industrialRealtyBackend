import type { MockMethod } from 'vite-plugin-mock'
import { mockKpis, mockRegionBars, mockStaffActivity } from './data/dashboard'
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
      }),
  },
  {
    url: '/api/staff/list',
    method: 'get',
    response: () => ok({ list: mockStaffRows }),
  },
  {
    url: '/api/staff/form',
    method: 'get',
    response: () => ok(mockStaffFormDefault),
  },
  {
    url: '/api/whitelist',
    method: 'get',
    response: () => ok({ list: mockWhitelistRows }),
  },
  {
    url: '/api/sys-admin-users',
    method: 'get',
    response: () => ok({ list: mockSysAdminUsers.map((r) => ({ ...r })) }),
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
    url: '/api/regions/defs',
    method: 'get',
    response: () => ok({ list: mockRegionDefs.map((r) => ({ ...r })) }),
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
      return ok({ list })
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
    url: '/api/audit/queue',
    method: 'get',
    response: () => ok({ list: mockAuditQueue }),
  },
  {
    url: '/api/customers',
    method: 'get',
    response: () => ok({ list: mockCustomerRows.map((r) => ({ ...r })) }),
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
    response: () => ok({ list: mockVideoFaqRows }),
  },
  {
    url: '/api/viewings/summary',
    method: 'get',
    response: () => ok({ viewings: mockViewingRows, deals: mockDealRows }),
  },
  {
    url: '/api/announcements',
    method: 'get',
    response: () => ok({ list: mockAnnouncements }),
  },
  {
    url: '/api/logs',
    method: 'get',
    response: () => ok({ list: mockLogs }),
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
    url: '/api/properties/bulk-follow',
    method: 'post',
    response: () => ok({ success: true, count: 1 }),
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
