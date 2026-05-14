import axios from 'axios'
import type { AxiosResponse } from 'axios'

/** Standard API Result wrapper — align with backend `Result<T>` / `R<T>` */
export interface ApiResult<T> {
  code: number
  message: string
  result: T
}

/** Business success code (HTTP-aligned; change if your server uses e.g. 0) */
export const API_SUCCESS_CODE = 200

export const ADMIN_TOKEN_KEY = 'admin_token'
export const ADMIN_SESSION_EXPIRES_AT_KEY = 'admin_token_expires_at'

export const http = axios.create({
  baseURL: '/api',
  timeout: 20000,
})

function clearStoredSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_SESSION_EXPIRES_AT_KEY)
}

http.interceptors.request.use((config) => {
  const expIso = localStorage.getItem(ADMIN_SESSION_EXPIRES_AT_KEY)
  if (expIso && new Date(expIso).getTime() <= Date.now()) {
    const url = String(config.url || '')
    if (!url.includes('/auth/login')) {
      clearStoredSession()
      void import('@/stores/auth').then(({ useAuthStore }) => {
        const auth = useAuthStore()
        auth.token = null
        auth.user = null
        auth.sessionExpiresAt = null
      })
      return Promise.reject(new axios.AxiosError('会话已过期', 'ERR_SESSION_EXPIRED', config))
    }
  }
  const t = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (t) {
    config.headers = config.headers || {}
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${t}`
    }
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    if (!axios.isAxiosError(err)) return Promise.reject(err)
    const status = err.response?.status
    const url = String(err.config?.url || '')
    const code = err.code
    if ((status === 401 || code === 'ERR_SESSION_EXPIRED') && !url.includes('/auth/login')) {
      clearStoredSession()
      try {
        const { useAuthStore } = await import('@/stores/auth')
        const auth = useAuthStore()
        auth.token = null
        auth.user = null
        auth.sessionExpiresAt = null
      } catch {
        /* Pinia may not be ready */
      }
    }
    return Promise.reject(err)
  },
)

export function unwrap<T>(response: AxiosResponse<ApiResult<T>>): T {
  const body = response.data
  if (!body || typeof body.code !== 'number') {
    throw new Error('Invalid response')
  }
  if (body.code !== API_SUCCESS_CODE) {
    throw new Error(body.message || 'Request failed')
  }
  return body.result
}
