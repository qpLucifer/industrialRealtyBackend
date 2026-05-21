import axios from 'axios'
import { ADMIN_TOKEN_KEY, API_SUCCESS_CODE, type ApiResult } from '@/api/http'
import {
  IMAGE_UPLOAD_TIMEOUT_MS,
  MAX_IMAGES_PER_PICK,
  MULTIPART_CHUNK_BYTES,
  VIDEO_PART_TIMEOUT_MS,
  validateImageFile,
  validateVideoFile,
} from '@/lib/mediaUploadPolicy'

export type BatchUploadItem = { name: string; ok: boolean; url?: string; error?: string }

export type BatchUploadSummary = {
  succeeded: BatchUploadItem[]
  failed: BatchUploadItem[]
}

const uploadHttp = axios.create({
  baseURL: '/api',
  timeout: IMAGE_UPLOAD_TIMEOUT_MS,
})

uploadHttp.interceptors.request.use((config) => {
  const t = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (t) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

function unwrap<T>(data: ApiResult<T>): T {
  if (!data || typeof data.code !== 'number') throw new Error('Invalid response')
  if (data.code !== API_SUCCESS_CODE) throw new Error(data.message || '请求失败')
  return data.result
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as ApiResult<unknown> | undefined)?.message
    if (typeof msg === 'string' && msg.trim()) return msg.trim()
    if (err.code === 'ECONNABORTED') return '上传超时，请检查网络或缩小文件后重试'
    if (err.message?.trim()) return err.message.trim()
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim()
  return fallback
}

export async function uploadImageFile(file: File, folder?: string): Promise<{ url: string; key: string }> {
  const fd = new FormData()
  fd.append('file', file)
  if (folder) fd.append('folder', folder)
  const res = await uploadHttp.post<ApiResult<{ url: string; key: string }>>('/upload/oss', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: IMAGE_UPLOAD_TIMEOUT_MS,
  })
  return unwrap(res.data)
}

/** Pick at most MAX_IMAGES_PER_PICK; per-file try/catch with summary. */
export async function uploadImagesBatch(
  files: File[],
  folder?: string,
  onProgress?: (done: number, total: number) => void,
): Promise<BatchUploadSummary> {
  if (files.length > MAX_IMAGES_PER_PICK) {
    throw new Error(`一次最多选择 ${MAX_IMAGES_PER_PICK} 张图片`)
  }
  const succeeded: BatchUploadItem[] = []
  const failed: BatchUploadItem[] = []
  const total = files.length
  let done = 0
  for (const file of files) {
    const pre = validateImageFile(file)
    if (pre) {
      failed.push({ name: file.name, ok: false, error: pre })
      done++
      onProgress?.(done, total)
      continue
    }
    try {
      const { url } = await uploadImageFile(file, folder)
      succeeded.push({ name: file.name, ok: true, url })
    } catch (e) {
      failed.push({ name: file.name, ok: false, error: apiErrorMessage(e, '上传失败') })
    }
    done++
    onProgress?.(done, total)
  }
  return { succeeded, failed }
}

type MultipartInit = {
  sessionId: string
  chunkSize: number
  totalParts: number
}

async function initVideoMultipart(
  file: File,
  folder?: string,
): Promise<MultipartInit> {
  const res = await uploadHttp.post<ApiResult<MultipartInit>>(
    '/upload/oss/multipart/init',
    {
      filename: file.name,
      mimeType: file.type || 'video/mp4',
      size: file.size,
      folder,
    },
    { timeout: 30_000 },
  )
  return unwrap(res.data)
}

async function uploadVideoPart(
  sessionId: string,
  partNumber: number,
  blob: Blob,
): Promise<void> {
  const fd = new FormData()
  fd.append('sessionId', sessionId)
  fd.append('partNumber', String(partNumber))
  fd.append('chunk', blob, `part-${partNumber}`)
  await uploadHttp.post('/upload/oss/multipart/part', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: VIDEO_PART_TIMEOUT_MS,
  })
}

async function completeVideoMultipart(sessionId: string): Promise<{ url: string; key: string }> {
  const res = await uploadHttp.post<ApiResult<{ url: string; key: string }>>(
    '/upload/oss/multipart/complete',
    { sessionId },
    { timeout: 60_000 },
  )
  return unwrap(res.data)
}

/** Chunked OSS upload with 0–100 progress. */
export async function uploadVideoMultipart(
  file: File,
  folder?: string,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; key: string }> {
  const pre = validateVideoFile(file)
  if (pre) throw new Error(pre)

  const { sessionId, chunkSize, totalParts } = await initVideoMultipart(file, folder)
  const chunk = chunkSize > 0 ? chunkSize : MULTIPART_CHUNK_BYTES
  let offset = 0
  let partNumber = 1

  while (offset < file.size) {
    const end = Math.min(offset + chunk, file.size)
    const blob = file.slice(offset, end)
    await uploadVideoPart(sessionId, partNumber, blob)
    offset = end
    partNumber += 1
    const pct = Math.min(99, Math.round((offset / file.size) * 100))
    onProgress?.(pct)
  }

  const result = await completeVideoMultipart(sessionId)
  onProgress?.(100)
  return result
}

export function formatBatchUploadToast(summary: BatchUploadSummary): string {
  const { succeeded, failed } = summary
  if (!failed.length) return `已成功上传 ${succeeded.length} 张图片`
  if (!succeeded.length) return `全部失败：${failed[0]?.error || '上传失败'}`
  return `成功 ${succeeded.length} 张，失败 ${failed.length} 张`
}

export function formatBatchUploadDetail(summary: BatchUploadSummary): string {
  return summary.failed.map((f) => `${f.name}：${f.error || '失败'}`).join('\n')
}
