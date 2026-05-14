/** Announcements — aligned with admin AnnouncementRow */

export interface AnnouncementRow {
  id: number
  title: string
  scope: string
  popup: string
  schedule: string
  status: string
  statusTone: 'mint' | 'amber'
  body?: string | null
}

export const mockAnnouncements: AnnouncementRow[] = [
  {
    id: 1,
    title: '电费计价调整',
    scope: '全员',
    popup: '否',
    schedule: '',
    status: '已发布',
    statusTone: 'mint',
    body: '说明正文…',
  },
  {
    id: 2,
    title: '春节放假安排',
    scope: '全员',
    popup: '是',
    schedule: '2026-02-01T08:00|2026-02-08T23:59',
    status: '已发布',
    statusTone: 'amber',
    body: '弹窗示例…',
  },
]
