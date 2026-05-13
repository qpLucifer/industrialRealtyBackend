/** Region tree + staff binding preview — maps to region_node, staff_region_grant */

export interface RegionTreeLine {
  text: string
  indentPx: number
}

export interface RegionBindingRow {
  staffName: string
  nodeIds: string
}

export const mockRegionTreeLines: RegionTreeLine[] = [
  { text: '▼ 广东省', indentPx: 0 },
  { text: '▼ 广州市', indentPx: 14 },
  { text: '黄埔区 · 12 个产业园节点', indentPx: 28 },
  { text: '南沙区 · 7 个产业园节点', indentPx: 28 },
]

export const mockRegionBindings: RegionBindingRow[] = [
  { staffName: '陈思远', nodeIds: '黄埔区,增城区' },
  { staffName: '赵琦', nodeIds: '南沙区' },
]
