/** CRM customers — mutable for mock CRUD */

import type { CustomerDetail, CustomerGrade, CustomerRow } from '../../src/types/domain'

const baseRows: CustomerRow[] = [
  {
    id: 'c1',
    slug: 'zhangchen',
    company: '广州××电子装配有限公司',
    contactName: '张晨',
    titleLine: '张晨 · 广州××电子装配有限公司',
    phoneMasked: '139****9024',
    name: '张晨',
    addressHint: '黄埔 / 增城交界',
    demandSummary: '3000–5000㎡ · 租金 ≤35/㎡·月 · 丙二类 · 5T 行车 · 卸货平台',
    grade: 'A 类',
    dealStatus: '洽谈中',
    lastFollowAt: '2026-05-11 16:20',
    nextReminder: '明天 10:00',
    ownerName: '陈思远',
    hasNextReminderTag: 'amber',
  },
  {
    id: 'c2',
    slug: 'c2',
    company: '台州航森机电科技',
    contactName: '航森对接人',
    titleLine: '航森对接人 · 台州航森机电科技',
    phoneMasked: '0576****3288',
    name: '台州航森机电科技',
    addressHint: '浙江台州 · 路桥片区',
    demandSummary: '求购独门独院 6–7 亩 · 一楼层高 7–8m · 预算 3 千万内 · 机械加工',
    grade: 'B 类',
    dealStatus: '搁置',
    lastFollowAt: '2026-04-22 11:05',
    nextReminder: '—',
    ownerName: '王敏',
  },
  {
    id: 'c3',
    slug: 'c3',
    company: '台州星兔塑业有限公司',
    contactName: '星兔采购',
    titleLine: '星兔采购 · 台州星兔塑业有限公司',
    phoneMasked: '0576****7707',
    name: '台州星兔塑业有限公司',
    addressHint: '台州 · 近高速口',
    demandSummary: '2000㎡ 左右仓库 · 环评已通过类厂房优先',
    grade: 'C 类',
    dealStatus: '洽谈中',
    lastFollowAt: '2026-01-09 15:40',
    nextReminder: '周五 14:00',
    ownerName: '赵琦',
    hasNextReminderTag: 'mint',
  },
]

export let mockCustomerRows: CustomerRow[] = baseRows.map((r) => ({ ...r }))

const timelines: Record<string, string> = {
  zhangchen:
    '05-10 电话：接受半年付，需业主消防协助。<br />05-08 带看：黄埔科学城 A 栋，配电增容待确认。',
  c2: '04-22 外出，暂缓选址。<br />03-23 已发园区资料包，待回访。',
  c3: '01-09 现场拍照 11 亩厂房备选。<br />12-25 暂不考虑，节后回访。',
}

const phones: Record<string, string> = {
  zhangchen: '13900009024',
  c2: '057632883288',
  c3: '057677077707',
}

const contacts: Record<string, string> = {
  zhangchen: '张晨',
  c2: '航森对接人',
  c3: '星兔采购',
}

export function resetMockCustomers() {
  mockCustomerRows = baseRows.map((r) => ({ ...r }))
}

export function getMockCustomerDetail(slug: string): CustomerDetail | null {
  const row = mockCustomerRows.find((r) => r.slug === slug)
  if (!row) return null
  const s = slug
  return {
    ...row,
    contactName: contacts[s] || row.contactName || row.name,
    phone: phones[s] || '',
    badgesHtml: '私有',
    timelineHtml: timelines[s] || '',
  }
}

export function mockCustomerCreate(body: Record<string, unknown>) {
  const slug = String(body.slug || `cust-${Date.now()}`)
  if (mockCustomerRows.some((r) => r.slug === slug)) throw new Error('slug exists')
  const grade = (body.grade as CustomerGrade) || 'B 类'
  const company = String(body.company || '')
  const contactName = String(body.contactName || '')
  const titleLine =
    String(body.titleLine || '').trim() || (contactName && company ? `${contactName} · ${company}` : company || contactName || '新客户')
  const row: CustomerRow = {
    id: String(body.adminId || `id-${Date.now()}`).slice(0, 12),
    slug,
    company,
    contactName,
    titleLine,
    phoneMasked: (() => {
      const ph = String(body.phone || '')
      if (ph.length < 7) return ph || '—'
      return `${ph.slice(0, 3)}****${ph.slice(-4)}`
    })(),
    name: contactName || company || '新客户',
    addressHint: String(body.addressHint || ''),
    demandSummary: String(body.demandSummary || ''),
    grade,
    dealStatus: String(body.dealStatus || '洽谈中'),
    lastFollowAt: '',
    nextReminder: '—',
    ownerName: String(body.ownerName || ''),
  }
  mockCustomerRows.push(row)
  timelines[slug] = ''
  phones[slug] = String(body.phone || '')
  contacts[slug] = contactName
  return { slug, adminId: row.id }
}

export function mockCustomerUpdate(slug: string, body: Record<string, unknown>) {
  const i = mockCustomerRows.findIndex((r) => r.slug === slug)
  if (i < 0) throw new Error('not found')
  const cur = { ...mockCustomerRows[i] }
  if (body.company != null) cur.company = String(body.company)
  if (body.contactName != null) {
    cur.contactName = String(body.contactName)
    cur.name = String(body.contactName)
  }
  if (body.titleLine != null) cur.titleLine = String(body.titleLine)
  if (body.demandSummary != null) cur.demandSummary = String(body.demandSummary)
  if (body.addressHint != null) cur.addressHint = String(body.addressHint)
  if (body.ownerName != null) cur.ownerName = String(body.ownerName)
  if (body.grade != null) cur.grade = body.grade as CustomerGrade
  if (body.dealStatus != null) cur.dealStatus = String(body.dealStatus)
  if (body.phone) {
    phones[slug] = String(body.phone)
    const s = String(body.phone)
    if (s.length >= 7) cur.phoneMasked = `${s.slice(0, 3)}****${s.slice(-4)}`
  }
  mockCustomerRows[i] = cur
  if (body.contactName) contacts[slug] = String(body.contactName)
}

export function mockCustomerDelete(slug: string) {
  const i = mockCustomerRows.findIndex((r) => r.slug === slug)
  if (i < 0) throw new Error('not found')
  mockCustomerRows.splice(i, 1)
  delete timelines[slug]
  delete phones[slug]
  delete contacts[slug]
}

/** Append one line to mock timeline (HTML) and bump lastFollowAt */
export function mockAppendCustomerFollow(slug: string, line: string, occurredAtShort: string) {
  const prev = timelines[slug] || ''
  timelines[slug] = prev ? `${line}<br />${prev}` : line
  const i = mockCustomerRows.findIndex((r) => r.slug === slug)
  if (i >= 0) {
    mockCustomerRows[i] = { ...mockCustomerRows[i], lastFollowAt: occurredAtShort }
  }
}
