/** CRM customers — maps to customer, follow_up, reminder */

export type CustomerGrade = 'A 类' | 'B 类' | 'C 类'

export interface CustomerRow {
  id: string
  phoneMasked: string
  name: string
  addressHint: string
  demandSummary: string
  grade: CustomerGrade
  lastFollowAt: string
  nextReminder: string | '—'
  timelineHtml: string
  ownerName: string
  hasNextReminderTag?: 'amber' | 'mint'
}

export const mockCustomers: CustomerRow[] = [
  {
    id: 'c1',
    phoneMasked: '139****9024',
    name: '张晨',
    addressHint: '黄埔 / 增城交界',
    demandSummary: '3000–5000㎡ · 租金 ≤35/㎡·月 · 丙二类 · 5T 行车 · 卸货平台',
    grade: 'A 类',
    lastFollowAt: '2026-05-11 16:20',
    nextReminder: '明天 10:00',
    timelineHtml:
      '05-10 电话：接受半年付，需业主消防协助。<br />05-08 带看：黄埔科学城 A 栋，配电增容待确认。',
    ownerName: '陈思远',
    hasNextReminderTag: 'amber',
  },
  {
    id: 'c2',
    phoneMasked: '0576****3288',
    name: '台州航森机电科技',
    addressHint: '浙江台州 · 路桥片区',
    demandSummary: '求购独门独院 6–7 亩 · 一楼层高 7–8m · 预算 3 千万内 · 机械加工',
    grade: 'B 类',
    lastFollowAt: '2026-04-22 11:05',
    nextReminder: '—',
    timelineHtml: '04-22 外出，暂缓选址。<br />03-23 已发园区资料包，待回访。',
    ownerName: '王敏',
  },
  {
    id: 'c3',
    phoneMasked: '0576****7707',
    name: '台州星兔塑业有限公司',
    addressHint: '台州 · 近高速口',
    demandSummary: '2000㎡ 左右仓库 · 环评已通过类厂房优先',
    grade: 'C 类',
    lastFollowAt: '2026-01-09 15:40',
    nextReminder: '周五 14:00',
    timelineHtml: '01-09 现场拍照 11 亩厂房备选。<br />12-25 暂不考虑，节后回访。',
    ownerName: '赵琦',
    hasNextReminderTag: 'mint',
  },
]
