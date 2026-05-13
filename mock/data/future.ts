/** Future API placeholders — maps to feature_flags / route registry */

export const mockFutureEndpoints: { method: string; path: string; desc: string }[] = [
  { method: 'POST', path: '/api/v1/finance/reconcile', desc: '财务对账' },
  { method: 'GET', path: '/api/v1/ranking/performance', desc: '业绩排行' },
  { method: 'POST', path: '/api/v1/hr/attendance', desc: '员工打卡' },
  { method: 'POST', path: '/api/v1/park/leads', desc: '产业园招商线索' },
  { method: 'POST', path: '/api/v1/partner/register', desc: '加盟合伙人报备' },
]
