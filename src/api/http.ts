import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'
import { notifySessionExpired } from '@/lib/sessionExpireNotify'
import { resolveApiErrorMessage, shouldShowGlobalApiError } from '@/lib/apiError'

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
      notifySessionExpired('会话已过期，请重新登录。')
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
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && typeof (body as ApiResult<unknown>).code === 'number') {
      const code = (body as ApiResult<unknown>).code
      if (code !== API_SUCCESS_CODE) {
        const msg = (body as ApiResult<unknown>).message || '请求失败'
        return Promise.reject(Object.assign(new Error(msg), { response: res }))
      }
    }
    return res
  },
  async (err: unknown) => {
    if (!axios.isAxiosError(err)) return Promise.reject(err)
    const axErr = err as AxiosError<ApiResult<unknown>>
    const status = axErr.response?.status
    const url = String(axErr.config?.url || '')
    const code = axErr.code
    if ((status === 401 || code === 'ERR_SESSION_EXPIRED') && !url.includes('/auth/login')) {
      const hadSession =
        !!localStorage.getItem(ADMIN_TOKEN_KEY) ||
        !!localStorage.getItem(ADMIN_SESSION_EXPIRES_AT_KEY)
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
      if (hadSession || code === 'ERR_SESSION_EXPIRED') {
        const body = axErr.response?.data
        const serverMsg = typeof body?.message === 'string' ? body.message.trim() : ''
        notifySessionExpired(
          code === 'ERR_SESSION_EXPIRED'
            ? '会话已过期，请重新登录。'
            : serverMsg || undefined,
        )
      }
    } else if (shouldShowGlobalApiError(axErr.config, status)) {
      const msg = resolveApiErrorMessage(axErr, '请求失败')
      const { ElMessage } = await import('element-plus')
      ElMessage.error(msg)
    }
    const msg = resolveApiErrorMessage(axErr, '请求失败')
    return Promise.reject(Object.assign(new Error(msg), { cause: axErr }))
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
