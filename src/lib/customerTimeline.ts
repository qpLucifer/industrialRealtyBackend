import { formatTimelineLine } from './beijingTime'

/** Parse follow-up timeline lines without rendering HTML (XSS-safe). */
export function timelineLinesFromDetail(detail: {
  timelineJson?: unknown
  timelineHtml?: string
}): string[] {
  const raw = detail.timelineJson
  if (raw != null) {
    let arr: unknown = raw
    if (typeof raw === 'string') {
      try {
        arr = JSON.parse(raw)
      } catch {
        arr = []
      }
    }
    if (Array.isArray(arr)) {
      return arr.map((s) => formatTimelineLine(String(s).trim())).filter(Boolean)
    }
  }
  const html = String(detail.timelineHtml || '').trim()
  if (!html) return []
  return html
    .split(/<br\s*\/?>/gi)
    .map((line) => line.replace(/<[^>]*>/g, '').trim())
    .map((line) => formatTimelineLine(line))
    .filter(Boolean)
}
