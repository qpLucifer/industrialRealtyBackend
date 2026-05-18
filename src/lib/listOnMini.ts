/** MySQL TINYINT(1) may arrive as 0/1 — avoid `value !== false` which treats 0 as true. */
export function isListOnMini(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}
