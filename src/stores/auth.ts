import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types/domain'
import { loginApi, fetchMe, logoutApi } from '@/api/auth'
import { ADMIN_TOKEN_KEY, ADMIN_SESSION_EXPIRES_AT_KEY } from '@/api/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(ADMIN_TOKEN_KEY))
  const sessionExpiresAt = ref<string | null>(localStorage.getItem(ADMIN_SESSION_EXPIRES_AT_KEY))
  const user = ref<AuthUser | null>(null)

  function purgeIfExpired() {
    if (!token.value) return
    const iso = sessionExpiresAt.value
    if (iso && new Date(iso).getTime() <= Date.now()) {
      token.value = null
      sessionExpiresAt.value = null
      user.value = null
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_SESSION_EXPIRES_AT_KEY)
    }
  }
  purgeIfExpired()

  const isAuthenticated = computed(() => {
    if (!token.value) return false
    const iso = sessionExpiresAt.value
    if (!iso) return true
    return new Date(iso).getTime() > Date.now()
  })

  async function hydrateUser() {
    purgeIfExpired()
    if (!token.value) return
    const u = await fetchMe()
    user.value = u
    if (u.sessionExpiresAt) {
      sessionExpiresAt.value = u.sessionExpiresAt
      localStorage.setItem(ADMIN_SESSION_EXPIRES_AT_KEY, u.sessionExpiresAt)
    }
  }

  async function login(username: string, password: string) {
    const r = await loginApi(username, password)
    token.value = r.token
    sessionExpiresAt.value = r.expiresAt
    localStorage.setItem(ADMIN_TOKEN_KEY, r.token)
    localStorage.setItem(ADMIN_SESSION_EXPIRES_AT_KEY, r.expiresAt)
    user.value = r.user
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      /* still clear session if server unreachable */
    }
    token.value = null
    sessionExpiresAt.value = null
    user.value = null
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem(ADMIN_SESSION_EXPIRES_AT_KEY)
  }

  return { token, sessionExpiresAt, user, isAuthenticated, login, logout, hydrateUser }
})
