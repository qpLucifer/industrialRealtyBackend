/** Strip UTF-8 BOM (Excel / template exports). */
export function stripBom(s: string): string {
  return s.replace(/^\uFEFF/, '')
}

/** RFC 4180-style field escaping for CSV output. */
export function csvEscape(cell: string | number | undefined | null): string {
  const s = String(cell ?? '')
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * Parse one CSV line: quoted fields may contain commas; "" inside quotes → ".
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  const str = String(line)
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (inQuotes) {
      if (c === '"') {
        if (str[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

export function parseCsvWithHeader(text: string): { headers: string[]; rows: string[][] } {
  const normalized = stripBom(text)
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.replace(/\s/g, '').length > 0)
  if (!lines.length) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map((l) => parseCsvLine(l).map((c) => c.trim()))
  return { headers, rows }
}

/** First matching column index (case-insensitive header names). */
export function headerIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.trim().toLowerCase())
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase())
    if (i >= 0) return i
  }
  return -1
}
