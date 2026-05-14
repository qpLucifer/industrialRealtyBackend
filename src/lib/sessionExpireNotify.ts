import { ElMessageBox } from 'element-plus'

/** Avoid stacking multiple alerts when many requests fail at once. */
let expireAlertShown = false

const DEFAULT_MSG =
  '您的登录状态已失效或会话已过期，请重新登录后继续操作。'

/**
 * Show a blocking alert when session ends (local expiry or 401).
 * Call resetSessionExpireNotify() after successful login.
 */
export function notifySessionExpired(customMessage?: string): void {
  if (expireAlertShown) return
  expireAlertShown = true
  void (async () => {
    try {
      await ElMessageBox.alert(customMessage || DEFAULT_MSG, '会话过期', {
        confirmButtonText: '重新登录',
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false,
        autofocus: true,
      })
    } catch {
      /* user dismissed via rare path */
    }
    try {
      const { default: router } = await import('@/router')
      const cur = router.currentRoute.value
      if (cur.name !== 'login') {
        await router.replace({
          name: 'login',
          query: { redirect: cur.fullPath },
        })
      }
    } catch {
      /* router not ready */
    }
  })()
}

export function resetSessionExpireNotify(): void {
  expireAlertShown = false
}
