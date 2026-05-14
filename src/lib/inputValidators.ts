/** Shared input validation helpers for admin forms */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

export function isValidEmail(s: string): boolean {
  const t = String(s || '').trim()
  if (!t) return true
  return EMAIL_REGEX.test(t)
}

/** Keep digits only (integers: floors, counts, etc.) */
export function sanitizeDigitsInt(raw: string): string {
  return String(raw || '').replace(/\D/g, '')
}

/** Digits and at most one decimal point */
export function sanitizeDigitsDecimal(raw: string): string {
  let t = String(raw || '').replace(/[^\d.]/g, '')
  const dot = t.indexOf('.')
  if (dot >= 0) {
    t = t.slice(0, dot + 1) + t.slice(dot + 1).replace(/\./g, '')
  }
  return t
}

export function parseOptionalNumber(s: string, allowDecimal: boolean): number | null {
  const t = String(s || '').trim()
  if (t === '' || t === '.') return null
  const n = allowDecimal ? Number.parseFloat(t) : Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : null
}

export function parseRequiredNumber(s: string, allowDecimal: boolean, fallback = 0): number {
  const n = parseOptionalNumber(s, allowDecimal)
  return n == null ? fallback : n
}

/** Mainland mobile: exactly 11 digits, 1开头 */
export function isPhone11Cn(s: string): boolean {
  return /^1\d{10}$/.test(String(s || '').replace(/\s/g, ''))
}
