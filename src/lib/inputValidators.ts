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

/** Mainland mobile input: digits 0-9 only, max length 11 */
export function normalizeCnMobileInput(raw: string): string {
  return sanitizeDigitsInt(raw).slice(0, 11)
}

const PHONE_INPUT_NAV_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
])

/** For phone fields: block non-digit keystrokes (including during IME; no Chinese/pinyin in field). */
export function preventNonDigitPhoneKeys(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (PHONE_INPUT_NAV_KEYS.has(e.key)) return
  if (e.key.length === 1 && e.key >= '0' && e.key <= '9') return
  e.preventDefault()
}

function phoneInsertWouldExceed11(el: HTMLInputElement, insertText: string): boolean {
  const v = el.value
  const a = el.selectionStart ?? v.length
  const b = el.selectionEnd ?? v.length
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  const newLen = v.length - (end - start) + insertText.length
  return newLen > 11
}

/**
 * Block non-digit insertion before it hits the field (typed text, IME composition, etc.).
 * Paste and drop are handled in {@link handleCnMobilePaste} so only digits are merged.
 */
export function preventNonDigitPhoneBeforeInput(e: Event): void {
  if (!('inputType' in e)) return
  const ie = e as InputEvent
  const type = ie.inputType || ''
  if (type.startsWith('delete') || type === 'historyUndo' || type === 'historyRedo') return
  if (!ie.data || ie.data === '') return
  if (type === 'insertFromPaste' || type === 'insertFromDrop') return
  // IME: pinyin / candidate / committed Han characters are all non-digit → block
  if (type === 'insertCompositionText' || type === 'insertFromComposition') {
    if (/\D/.test(ie.data)) {
      ie.preventDefault()
      return
    }
    const el = e.target as HTMLInputElement
    if (phoneInsertWouldExceed11(el, ie.data)) ie.preventDefault()
    return
  }
  if (/\D/.test(ie.data)) {
    ie.preventDefault()
    return
  }
  const el = e.target as HTMLInputElement
  if (phoneInsertWouldExceed11(el, ie.data)) ie.preventDefault()
}

/** After IME ends, strip any non-digits that slipped through (older engines / edge cases). */
export function onCnMobileCompositionEnd(e: CompositionEvent, setValue: (v: string) => void): void {
  const el = e.target as HTMLInputElement
  const v = normalizeCnMobileInput(el.value)
  setValue(v)
  queueMicrotask(() => {
    if (el.value !== v) el.value = v
    try {
      el.setSelectionRange(v.length, v.length)
    } catch {
      /* ignore */
    }
  })
}

/** Intercept paste so only digits are inserted (no flash of invalid characters). */
export function handleCnMobilePaste(
  e: ClipboardEvent,
  getValue: () => string,
  setValue: (v: string) => void,
): void {
  e.preventDefault()
  const chunk = sanitizeDigitsInt(e.clipboardData?.getData('text/plain') || '')
  const el = e.target as HTMLInputElement
  const cur = getValue()
  const a = el.selectionStart ?? cur.length
  const b = el.selectionEnd ?? cur.length
  const start = Math.min(a, b)
  const end = Math.max(a, b)
  const merged = normalizeCnMobileInput(cur.slice(0, start) + chunk + cur.slice(end))
  setValue(merged)
  queueMicrotask(() => {
    try {
      const pos = Math.min(start + chunk.length, merged.length)
      el.setSelectionRange(pos, pos)
    } catch {
      /* ignore */
    }
  })
}

/** Non-empty value must satisfy {@link isValidEmail}; empty is valid (optional fields). */
export function emailFormatErrorMessage(s: string): string | null {
  const t = String(s || '').trim()
  if (!t) return null
  return isValidEmail(t) ? null : '请输入有效的邮箱地址'
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
