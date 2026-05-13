/** Announcements — maps to announcement, push_scope */

export interface AnnouncementRow {
  title: string
  scope: string
  popup: string
  schedule: string
  status: '已发送' | '计划中'
  statusTone: 'mint' | 'amber'
}

export const mockAnnouncements: AnnouncementRow[] = [
  { title: '电费计价调整', scope: '全员', popup: '是', schedule: '立即', status: '已发送', statusTone: 'mint' },
  { title: '报备流程培训', scope: '业务员', popup: '否', schedule: '周五 15:00', status: '计划中', statusTone: 'amber' },
]
