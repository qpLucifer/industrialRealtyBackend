/**
 * Leading-edge throttle for primary pointer clicks on actionable controls.
 * Uses capture on document so duplicate clicks within the window are dropped before Vue handlers run.
 */

const DEFAULT_MS = 420

const SKIP_SUBTREE_SELECTOR = [
  '[data-skip-tap]',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  '.el-input-number',
  '.el-slider',
  '.el-rate',
  '.el-picker-panel',
  '.el-select-dropdown',
  '.el-cascader__dropdown',
  '.el-popper',
  '.el-dropdown__popper',
  '.el-color-picker__panel',
  '.el-image-viewer__wrapper',
  '.el-carousel',
  '.map-latlng-wrap',
  '.amap-container',
  '.amap-maps',
].join(', ')

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true
  if (target.closest(SKIP_SUBTREE_SELECTOR)) return true
  return false
}

function resolveActionHost(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const el = target
  return (
    el.closest('button') ||
    el.closest('a.btn') ||
    el.closest('.el-button') ||
    el.closest('[role="button"]') ||
    null
  )
}

const lastFireAt = new WeakMap<HTMLElement, number>()

export function installGlobalButtonDebounce(ms = DEFAULT_MS) {
  const onClickCapture = (e: MouseEvent) => {
    if (e.button !== 0) return
    if (shouldIgnoreTarget(e.target)) return
    const host = resolveActionHost(e.target)
    if (!host) return
    if (host.closest('[data-skip-tap]')) return
    const now = Date.now()
    const prev = lastFireAt.get(host) ?? 0
    if (now - prev < ms) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      return
    }
    lastFireAt.set(host, now)
  }

  document.addEventListener('click', onClickCapture, true)
  return () => document.removeEventListener('click', onClickCapture, true)
}
