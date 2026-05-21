/** Keep in sync with industrialRealtyServer/src/lib/uploadPolicy.js */

export const MAX_IMAGE_BYTES = 50 * 1024 * 1024
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024
export const MAX_IMAGES_PER_PICK = 5
export const MAX_VIDEOS_PER_PICK = 1
export const MULTIPART_CHUNK_BYTES = 5 * 1024 * 1024
export const IMAGE_UPLOAD_TIMEOUT_MS = 120_000
export const VIDEO_PART_TIMEOUT_MS = 180_000

export const ALLOWED_IMAGE_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function formatBytes(n: number) {
  if (n >= 1024 * 1024) return `${Math.round(n / (1024 * 1024))}MB`
  if (n >= 1024) return `${Math.round(n / 1024)}KB`
  return `${n}B`
}

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return `「${file.name}」超过 ${formatBytes(MAX_IMAGE_BYTES)} 上限`
  }
  const mime = (file.type || '').toLowerCase()
  if (mime && !ALLOWED_IMAGE_MIME_PREFIXES.includes(mime)) {
    return `「${file.name}」格式不支持（仅 jpeg/png/webp/gif）`
  }
  return null
}

export function validateVideoFile(file: File): string | null {
  if (file.size > MAX_VIDEO_BYTES) {
    return `「${file.name}」超过 ${formatBytes(MAX_VIDEO_BYTES)} 上限`
  }
  const mime = (file.type || '').toLowerCase()
  if (mime && !mime.startsWith('video/')) {
    return `「${file.name}」不是视频文件`
  }
  if (mime && mime !== 'video/mp4' && mime !== 'video/quicktime') {
    return `「${file.name}」仅支持 mp4 / mov`
  }
  return null
}
