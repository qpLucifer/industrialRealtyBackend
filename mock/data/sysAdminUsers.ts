/** Mock sys_users (admin only) for admin-web CI */

import type { SysAdminUserRow } from '../../src/types/domain'

const base: SysAdminUserRow[] = [
  {
    id: 1,
    username: 'admin',
    displayName: '周瑾',
    roleLine: '超级管理员 · 全区域',
    avatarUrl: null,
    userKind: 'admin',
    hasLoginPassword: false,
    createdAt: '2026-05-01 10:00',
  },
]

export let mockSysAdminUsers: SysAdminUserRow[] = base.map((r) => ({ ...r }))

let nextId = 10

export function resetMockSysAdminUsers() {
  mockSysAdminUsers = base.map((r) => ({ ...r }))
  nextId = 10
}

export function mockSysAdminUserCreate(body: Record<string, unknown>) {
  const username = String(body.username || '').trim().toLowerCase()
  if (mockSysAdminUsers.some((u) => u.username === username)) {
    throw new Error('dup')
  }
  const id = nextId++
  mockSysAdminUsers.push({
    id,
    username,
    displayName: String(body.displayName || ''),
    roleLine: String(body.roleLine || ''),
    avatarUrl: (body.avatarUrl as string) || null,
    userKind: 'admin',
    hasLoginPassword: true,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  })
  return { id }
}

export function mockSysAdminUserUpdate(id: number, body: Record<string, unknown>) {
  const i = mockSysAdminUsers.findIndex((u) => u.id === id)
  if (i < 0) throw new Error('not found')
  const cur = { ...mockSysAdminUsers[i] }
  if (body.username != null) cur.username = String(body.username).trim().toLowerCase()
  if (body.displayName != null) cur.displayName = String(body.displayName)
  if (body.roleLine != null) cur.roleLine = String(body.roleLine)
  if (body.avatarUrl !== undefined) cur.avatarUrl = (body.avatarUrl as string) || null
  if (body.password && String(body.password)) cur.hasLoginPassword = true
  mockSysAdminUsers[i] = cur
}

export function mockSysAdminUserDelete(id: number) {
  const i = mockSysAdminUsers.findIndex((u) => u.id === id)
  if (i < 0) throw new Error('not found')
  if (mockSysAdminUsers.length <= 1) throw new Error('last admin')
  mockSysAdminUsers.splice(i, 1)
}
