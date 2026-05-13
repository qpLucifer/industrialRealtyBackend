import type { RegionDefRow } from '../../src/types/domain'

/** Mutable mock store for region_defs API */
export let mockRegionDefs: RegionDefRow[] = [
  { id: 1, name: '黄埔区', sortOrder: 0 },
  { id: 2, name: '增城区', sortOrder: 1 },
  { id: 3, name: '南沙区', sortOrder: 2 },
  { id: 4, name: '花都区', sortOrder: 3 },
]

let nextId = 5

export function resetMockRegionDefs() {
  mockRegionDefs = [
    { id: 1, name: '黄埔区', sortOrder: 0 },
    { id: 2, name: '增城区', sortOrder: 1 },
    { id: 3, name: '南沙区', sortOrder: 2 },
    { id: 4, name: '花都区', sortOrder: 3 },
  ]
  nextId = 5
}

export function mockCreateRegionDef(name: string) {
  const n = String(name || '').trim()
  if (!n) throw new Error('empty')
  if (mockRegionDefs.some((r) => r.name === n)) throw new Error('dup')
  const row = { id: nextId++, name: n, sortOrder: mockRegionDefs.length }
  mockRegionDefs.push(row)
  return row
}

export function mockUpdateRegionDef(id: number, name: string) {
  const n = String(name || '').trim()
  const i = mockRegionDefs.findIndex((r) => r.id === id)
  if (i < 0) throw new Error('not found')
  if (mockRegionDefs.some((r) => r.name === n && r.id !== id)) throw new Error('dup')
  mockRegionDefs[i] = { ...mockRegionDefs[i], name: n }
  return mockRegionDefs[i]
}

export function mockDeleteRegionDef(id: number) {
  const i = mockRegionDefs.findIndex((r) => r.id === id)
  if (i < 0) throw new Error('not found')
  mockRegionDefs.splice(i, 1)
}
