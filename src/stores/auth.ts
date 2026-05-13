import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '@/types/domain'
import { loginApi, fetchMe } from '@/api/auth'

const TOKEN_KEY = 'admin_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value))

  async function hydrateUser() {
    if (!token.value) return
    user.value = await fetchMe()
  }

  async function login() {
    const { token: t, user: u } = await loginApi()
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
    user.value = u
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isAuthenticated, login, logout, hydrateUser }
})
