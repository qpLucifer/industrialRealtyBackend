import type { MockMethod } from 'vite-plugin-mock'
import { mockAuthUser } from './data/auth'
import { mockKpis, mockRegionBars, mockStaffActivity } from './data/dashboard'
import { mockStaffRows, mockStaffFormDefault } from './data/staff'
import { mockWhitelistRows } from './data/whitelist'
import { mockRegionTreeLines, mockRegionBindings } from './data/regions'
import { mockPropertyRows } from './data/properties'
import { mockAuditQueue } from './data/audit'
import { mockCustomers } from './data/customers'
import { mockVideoFaqRows } from './data/videoFaq'
import { mockViewingRows, mockDealRows } from './data/viewings'
import { mockAnnouncements } from './data/announcements'
import { mockLogs } from './data/logs'
import { mockSecuritySwitches } from './data/settings'
import { mockFutureEndpoints } from './data/future'
import { createDefaultPropertyForm } from './data/propertyForm'

const ok = <T,>(result: T) => ({ code: 200, message: 'success', result })

export default [
  {
    url: '/api/auth/login',
    method: 'post',
    response: () =>
      ok({
        token: 'mock-jwt-admin-session',
        user: mockAuthUser,
      }),
  },
  {
    url: '/api/me',
    method: 'get',
    response: () => ok(mockAuthUser),
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
    response: () => ok({ list: mockPropertyRows }),
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
    response: () => ok({ list: mockCustomers }),
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
    response: () => ok({ success: true }),
  },
  {
    url: '/api/properties/snapshot',
    method: 'post',
    response: () => ok({ success: true }),
  },
] as MockMethod[]
