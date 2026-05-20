/** Beijing time (Asia/Shanghai) — align with server `beijingTime.js`. */

const BJ_TZ = 'Asia/Shanghai'

function beijingParts(date: Date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: BJ_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const map = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second || '00',
  }
}

export function formatBeijingYmdHm(date: Date = new Date()) {
  const p = beijingParts(date)
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`
}

export function toMysqlDateTime(input: unknown): string | null {
  if (input == null) return null
  const s = String(input).trim()
  if (!s || s === '—') return null
  if (/Z$|[+-]\d{2}:?\d{2}$/i.test(s)) {
    const t = Date.parse(s)
    if (!Number.isFinite(t)) return null
    const p = beijingParts(new Date(t))
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
  }
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return null
  const pad = (n: string | number) => String(n).padStart(2, '0')
  return `${m[1]}-${m[2]}-${pad(m[3])} ${pad(m[4])}:${pad(m[5])}:${pad(m[6] || '0')}`
}

export function toDatetimeLocalValue(input: unknown): string {
  const mysql = toMysqlDateTime(input)
  if (!mysql) return ''
  return `${mysql.slice(0, 10)}T${mysql.slice(11, 16)}`
}

export function nowBeijingDatetimeLocal(): string {
  return toDatetimeLocalValue(formatBeijingYmdHm())
}

export function formatBeijingDisplay(input: unknown): string {
  const mysql = toMysqlDateTime(input)
  if (!mysql) return ''
  return mysql.slice(0, 16)
}

export function parseBeijingNaiveToInstant(input: unknown): Date | null {
  const mysql = toMysqlDateTime(input)
  if (!mysql) return null
  const m = mysql.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+08:00`)
}

export function beijingTodayYmd(): string {
  return formatBeijingYmdHm().slice(0, 10)
}

/** datetime-local / form → API body (Beijing naive). */
export function datetimeLocalToApi(input: string): string {
  const mysql = toMysqlDateTime(input)
  return mysql ? mysql.slice(0, 16) : ''
}

/** Follow-up timeline line: normalize date prefix before ` · `. */
export function formatTimelineLine(line: string): string {
  const s = String(line || '').trim()
  const sep = s.indexOf(' · ')
  if (sep < 0) return formatBeijingDisplay(s) || s
  const head = formatBeijingDisplay(s.slice(0, sep).trim()) || s.slice(0, sep).trim()
  return `${head}${s.slice(sep)}`
}
