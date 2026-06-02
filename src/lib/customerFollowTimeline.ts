import { formatBeijingDisplay } from './beijingTime'

export const MAX_FOLLOW_IMAGES_PER_PICK = 5
export const MAX_FOLLOW_IMAGES = 50
export const MAX_FOLLOW_AUDIOS = 20
export const FOLLOW_UPLOAD_FOLDER = 'customers/follow-up'

export interface CustomerFollowEntry {
  occurredAt: string
  note: string
  imageUrls: string[]
  audioUrls: string[]
  displayLine: string
}

function normalizeFollowUrlList(raw: unknown, max: number): string[] {
  const arr = Array.isArray(raw) ? raw : raw != null && raw !== '' ? [raw] : []
  const out: string[] = []
  for (const item of arr) {
    const u = String(item || '').trim().slice(0, 512)
    if (!u || !/^https?:\/\//i.test(u)) continue
    if (out.includes(u)) continue
    out.push(u)
    if (out.length >= max) break
  }
  return out
}

function parseLegacyTimelineLine(s: string) {
  const str = String(s || '').trim()
  if (!str) return null
  const sep = str.indexOf(' · ')
  if (sep < 0) {
    return { occurredAt: '', note: str, imageUrls: [] as string[], audioUrls: [] as string[] }
  }
  return {
    occurredAt: str.slice(0, sep).trim(),
    note: str.slice(sep + 3).trim(),
    imageUrls: [] as string[],
    audioUrls: [] as string[],
  }
}

export function normalizeTimelineEntry(raw: unknown): Omit<CustomerFollowEntry, 'displayLine'> | null {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const row = raw as Record<string, unknown>
    return {
      occurredAt: String(row.occurredAt ?? row.at ?? '').trim(),
      note: String(row.note ?? row.text ?? '').trim(),
      imageUrls: normalizeFollowUrlList(row.imageUrls ?? row.images, MAX_FOLLOW_IMAGES),
      audioUrls: normalizeFollowUrlList(row.audioUrls ?? row.audios, MAX_FOLLOW_AUDIOS),
    }
  }
  if (typeof raw === 'string') return parseLegacyTimelineLine(raw)
  return null
}

export function formatFollowDisplayLine(entry: unknown): string {
  const e = normalizeTimelineEntry(entry)
  if (!e) return ''
  const head = (e.occurredAt && (formatBeijingDisplay(e.occurredAt) || e.occurredAt)) || ''
  let tail = e.note
  const tags: string[] = []
  if (e.imageUrls.length) tags.push(`图片×${e.imageUrls.length}`)
  if (e.audioUrls.length) tags.push(`语音×${e.audioUrls.length}`)
  if (tags.length) tail = tail ? `${tail}（${tags.join(' ')}）` : tags.join(' ')
  if (!tail) tail = '跟进记录'
  return head ? `${head} · ${tail}` : tail
}

export function toFollowEntry(raw: unknown): CustomerFollowEntry | null {
  const e = normalizeTimelineEntry(raw)
  if (!e) return null
  return { ...e, displayLine: formatFollowDisplayLine(e) }
}

export function timelineEntriesFromDetail(detail: {
  timelineJson?: unknown
  timelineHtml?: string
}): CustomerFollowEntry[] {
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
      return arr.map((row) => toFollowEntry(row)).filter((x): x is CustomerFollowEntry => Boolean(x))
    }
  }
  const html = String(detail.timelineHtml || '').trim()
  if (!html) return []
  return html
    .split(/<br\s*\/?>/gi)
    .map((line) => line.replace(/<[^>]*>/g, '').trim())
    .map((line) => toFollowEntry(line))
    .filter((x): x is CustomerFollowEntry => Boolean(x))
}

/** @deprecated Use timelineEntriesFromDetail */
export function timelineLinesFromDetail(detail: {
  timelineJson?: unknown
  timelineHtml?: string
}): string[] {
  return timelineEntriesFromDetail(detail).map((e) => e.displayLine)
}
