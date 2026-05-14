/** Mock admin session token (no HMAC; dev-only, parsed by mock /api/me). */

const TTL_MS = 7 * 24 * 60 * 60 * 1000

export function encodeMockAdminToken(sub: number) {
  const expMs = Date.now() + TTL_MS
  const payload = JSON.stringify({ sub, e: expMs })
  const token = `m.${Buffer.from(payload, 'utf8').toString('base64url')}`
  const expiresAt = new Date(expMs).toISOString()
  const expiresIn = Math.max(0, Math.floor((expMs - Date.now()) / 1000))
  return { token, expiresAt, expiresIn }
}

export function decodeMockAdminToken(token: string): { sub: number; expMs: number } | null {
  if (!token || !token.startsWith('m.')) return null
  try {
    const o = JSON.parse(Buffer.from(token.slice(2), 'base64url').toString('utf8')) as { sub?: number; e?: number }
    if (o.sub == null || o.e == null || o.e < Date.now()) return null
    return { sub: o.sub, expMs: o.e }
  } catch {
    return null
  }
}
