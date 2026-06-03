/** Dashboard KPIs — maps to analytics / reporting aggregates */

export interface KpiItem {
  label: string
  value: string
  trend?: string
}

export interface RegionBar {
  label: string
  heightPct: number
  count?: number
}

export interface StaffActivityRow {
  name: string
  followUps: number
  viewings: number
  deals: number
}

export interface DashboardPipelineItem {
  key: string
  label: string
  count: number
}

export interface DashboardAttentionItem {
  key: string
  label: string
  value: string
  hint?: string
}

export interface DashboardPlatformItem {
  key: string
  label: string
  value: string
}

export const mockKpis: KpiItem[] = [
  { label: '房源总数', value: '38', trend: '已上架 31' },
  { label: '出租 / 出售', value: '18', trend: '主推 6 · 待审 2' },
  { label: '客户总量', value: '126', trend: 'CRM 统筹' },
  { label: '成交备案', value: '14', trend: '带看 / 成交台账' },
]

export const mockRegionBars: RegionBar[] = [
  { label: '黄埔', heightPct: 42, count: 12 },
  { label: '南沙', heightPct: 76, count: 14 },
  { label: '花都', heightPct: 58, count: 8 },
  { label: '增城', heightPct: 36, count: 5 },
  { label: '未分区', heightPct: 24, count: 3 },
]

export const mockStaffActivity: StaffActivityRow[] = [
  { name: '陈思远', followUps: 42, viewings: 7, deals: 1 },
  { name: '王敏', followUps: 38, viewings: 5, deals: 0 },
  { name: '赵琦', followUps: 31, viewings: 4, deals: 2 },
]

export const mockPipeline: DashboardPipelineItem[] = [
  { key: 'live', label: '已上架', count: 31 },
  { key: 'pending', label: '待审核', count: 2 },
  { key: 'draft', label: '草稿', count: 3 },
  { key: 'rejected', label: '已驳回', count: 2 },
]

export const mockAttention: DashboardAttentionItem[] = [
  { key: 'audit', label: '待审核房源', value: '2', hint: '审核中心' },
  { key: 'draft', label: '草稿待完善', value: '3', hint: '小程序录入' },
  { key: 'rejected', label: '驳回待修改', value: '2', hint: '重新提交' },
  { key: 'viewings', label: '近 7 日带看', value: '16', hint: '带看台账' },
]

export const mockPlatform: DashboardPlatformItem[] = [
  { key: 'staff', label: '在职员工', value: '24' },
  { key: 'whitelist', label: '准入白名单', value: '22' },
  { key: 'privacy', label: '隐私授权', value: '8' },
  { key: 'miniCust', label: '小程序客户', value: '89' },
  { key: 'faq', label: '视频 FAQ', value: '12' },
  { key: 'land', label: '土地挂牌', value: '6' },
  { key: 'landLive', label: '在拍地块', value: '2' },
  { key: 'featured', label: '主推房源', value: '6' },
]
