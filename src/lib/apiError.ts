import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { ApiResult } from '@/api/http'

const GENERIC_AXIOS_STATUS = /^Request failed with status code \d+$/i

/** Extract user-facing message from axios / unwrap errors (incl. HTTP 400 + Result body). */
export function resolveApiErrorMessage(err: unknown, fallback = '操作失败'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === 'object') {
      const msg = (data as ApiResult<unknown>).message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
    if (
      typeof err.message === 'string' &&
      err.message.trim() &&
      !GENERIC_AXIOS_STATUS.test(err.message.trim())
    ) {
      return err.message.trim()
    }
  }
  if (err instanceof Error && err.message.trim() && !GENERIC_AXIOS_STATUS.test(err.message.trim())) {
    return err.message.trim()
  }
  return fallback
}

export function shouldShowGlobalApiError(
  config?: InternalAxiosRequestConfig,
  status?: number,
): boolean {
  const url = String(config?.url ?? '')
  if (url.includes('/auth/login')) return false
  if (status === 401) return false
  if (config?.headers?.['X-Skip-Api-Error'] === '1') return false
  return true
}

/** Mark request config to skip global error toast (page handles its own). */
export function withSilentApiError<T extends { headers?: Record<string, string> }>(config: T): T {
  return {
    ...config,
    headers: { ...config.headers, 'X-Skip-Api-Error': '1' },
  }
}
