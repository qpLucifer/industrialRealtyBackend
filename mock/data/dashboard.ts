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

export const mockKpis: KpiItem[] = [
  { label: '房源总数', value: '1,286' },
  { label: '待租 / 待售（空置）', value: '518' },
  { label: '客户总量', value: '3,402' },
  { label: '本月成交备案额', value: '¥428万' },
]

export const mockRegionBars: RegionBar[] = [
  { label: '黄埔', heightPct: 42, count: 128 },
  { label: '南沙', heightPct: 76, count: 230 },
  { label: '花都', heightPct: 58, count: 176 },
  { label: '增城', heightPct: 36, count: 110 },
  { label: '番禺', heightPct: 64, count: 195 },
  { label: '其它', heightPct: 30, count: 92 },
]

export const mockStaffActivity: StaffActivityRow[] = [
  { name: '陈思远', followUps: 42, viewings: 7, deals: 1 },
  { name: '王敏', followUps: 38, viewings: 5, deals: 0 },
  { name: '赵琦', followUps: 31, viewings: 4, deals: 2 },
]
