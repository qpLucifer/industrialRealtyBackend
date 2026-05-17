import axios from 'axios'
import type { ApiResult } from '@/api/http'

/** Extract user-facing message from axios / unwrap errors (incl. HTTP 400 + Result body). */
export function resolveApiErrorMessage(err: unknown, fallback = '操作失败'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data
    if (data && typeof data === 'object') {
      const msg = (data as ApiResult<unknown>).message
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
    if (typeof err.message === 'string' && err.message.trim() && err.message !== 'Request failed with status code 400') {
      return err.message.trim()
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return fallback
}
