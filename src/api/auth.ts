import { http, unwrap, type ApiResult } from './http'
import type { AuthUser } from '@/types/domain'

export async function loginApi(username: string, password: string) {
  const res = await http.post<
    ApiResult<{ token: string; user: AuthUser; expiresAt: string; expiresIn: number }>
  >('/auth/login', { username, password }, { validateStatus: () => true })
  return unwrap(res) as { token: string; user: AuthUser; expiresAt: string; expiresIn: number }
}

export async function fetchMe() {
  const res = await http.get('/me')
  return unwrap(res) as AuthUser
}

export async function logoutApi() {
  const res = await http.post('/auth/logout')
  return unwrap(res) as { success: boolean }
}
