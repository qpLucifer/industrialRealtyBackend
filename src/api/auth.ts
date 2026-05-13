import { http, unwrap } from './http'
import type { AuthUser } from '@/types/domain'

export async function loginApi() {
  const res = await http.post('/auth/login')
  return unwrap(res) as { token: string; user: AuthUser }
}

export async function fetchMe() {
  const res = await http.get('/me')
  return unwrap(res) as AuthUser
}
