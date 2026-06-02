/** COS/CI image process rule (no leading ?). Set VITE_MEDIA_IMAGE_PROCESS=off to skip. */
const DEFAULT_IMAGE_PROCESS_RULE = 'imageMogr2/format/webp/quality/88'
const RAW_IMAGE_PROCESS_RULE = String(import.meta.env.VITE_MEDIA_IMAGE_PROCESS ?? '').trim()
const IMAGE_PROCESS_RULE =
  RAW_IMAGE_PROCESS_RULE === 'off' || RAW_IMAGE_PROCESS_RULE === 'false'
    ? ''
    : RAW_IMAGE_PROCESS_RULE || DEFAULT_IMAGE_PROCESS_RULE

const IMAGE_EXT = /\.(jpe?g|png|gif|bmp|webp)(\?|#|$)/i
const VIDEO_EXT = /\.(mp4|mov|m4v|webm|m3u8)(\?|#|$)/i
const CI_PROCESS_IN_URL = /(?:[?&])image(?:Mogr2|View2|Slim)/i

export function isImageMediaUrl(url: string): boolean {
  const u = String(url || '').trim()
  if (!u || VIDEO_EXT.test(u)) return false
  return IMAGE_EXT.test(u)
}

export function applyCosImageProcess(url: string): string {
  const u = String(url || '').trim()
  if (!u || !/^https?:\/\//i.test(u) || !IMAGE_PROCESS_RULE) return u
  if (!isImageMediaUrl(u) || CI_PROCESS_IN_URL.test(u)) return u
  const sep = u.includes('?') ? '&' : '?'
  return `${u}${sep}${IMAGE_PROCESS_RULE}`
}
