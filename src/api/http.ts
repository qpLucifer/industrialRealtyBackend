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

export const http = axios.create({
  baseURL: '/api',
  timeout: 20000,
})

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
