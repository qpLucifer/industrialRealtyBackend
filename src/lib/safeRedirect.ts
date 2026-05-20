/** Only allow in-app admin paths after login (open-redirect guard). */
export function safeAppRedirect(raw: unknown, fallback = '/app/dashboard'): string {
  const s = String(raw ?? '').trim()
  if (!s.startsWith('/app')) return fallback
  if (s.includes('//') || s.includes('\\') || s.includes('@')) return fallback
  return s
}
