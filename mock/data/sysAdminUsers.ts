/** Mock sys_users (admin only) for admin-web CI */

import type { SysAdminUserRow } from '../../src/types/domain'

const base: SysAdminUserRow[] = [
  {
    id: 1,
    username: 'admin',
    displayName: '管理员',
    roleLine: '超级管理员',
    avatarUrl: null,
    userKind: 'admin',
    hasLoginPassword: true,
    createdAt: '2026-05-01 10:00',
  },
]

/** Plain passwords by user id — mock only (align with seed default Admin123!) */
const mockPlainPasswordByUserId = new Map<number, string>([[1, 'Admin123!']])

export let mockSysAdminUsers: SysAdminUserRow[] = base.map((r) => ({ ...r }))

let nextId = 10

export function resetMockSysAdminUsers() {
  mockSysAdminUsers = base.map((r) => ({ ...r }))
  mockPlainPasswordByUserId.clear()
  mockPlainPasswordByUserId.set(1, 'Admin123!')
  nextId = 10
}

export function mockTryAdminLogin(
  username: string,
  password: string,
): { ok: true; user: { displayName: string; roleLine: string; avatarUrl?: string }; id: number } | { ok: false; code: number; message: string } {
  const u = mockSysAdminUsers.find((x) => x.username === username.trim().toLowerCase())
  if (!u) return { ok: false, code: 401, message: '登录名或密码错误' }
  if (!u.hasLoginPassword) {
    return { ok: false, code: 403, message: '该账号尚未设置登录密码，请管理员在「用户管理」中设置密码后再登录' }
  }
  const expected = mockPlainPasswordByUserId.get(u.id)
  if (!expected || expected !== password) {
    return { ok: false, code: 401, message: '登录名或密码错误' }
  }
  return {
    ok: true,
    id: u.id,
    user: {
      displayName: u.displayName,
      roleLine: u.roleLine,
      avatarUrl: u.avatarUrl || undefined,
    },
  }
}

export function mockSysAdminUserCreate(body: Record<string, unknown>) {
  const username = String(body.username || '').trim().toLowerCase()
  if (mockSysAdminUsers.some((x) => x.username === username)) {
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
    createdAt: '2026-01-01 10:00',
  })
  mockPlainPasswordByUserId.set(id, String(body.password || ''))
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
  if (body.password && String(body.password)) {
    cur.hasLoginPassword = true
    mockPlainPasswordByUserId.set(id, String(body.password))
  }
  mockSysAdminUsers[i] = cur
}

export function mockSysAdminUserDelete(id: number) {
  const i = mockSysAdminUsers.findIndex((u) => u.id === id)
  if (i < 0) throw new Error('not found')
  if (mockSysAdminUsers.length <= 1) throw new Error('last admin')
  mockSysAdminUsers.splice(i, 1)
  mockPlainPasswordByUserId.delete(id)
}

export function mockGetAdminUserForMe(sub: number): { displayName: string; roleLine: string; avatarUrl?: string } | null {
  const u = mockSysAdminUsers.find((x) => x.id === sub)
  if (!u) return null
  return {
    displayName: u.displayName,
    roleLine: u.roleLine,
    avatarUrl: u.avatarUrl || undefined,
  }
}
