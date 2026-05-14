/** Load Gaode (AMap) JS API v2 once; use same GCJ-02 system as WeChat / Gaode mini programs. */

let loadPromise: Promise<void> | null = null

export function loadAmapScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  const w = window as unknown as { AMap?: unknown; _AMapSecurityConfig?: { securityJsCode: string } }
  if (w.AMap) return Promise.resolve()
  if (loadPromise) return loadPromise

  const key = import.meta.env.VITE_AMAP_WEB_KEY
  if (!key) {
    return Promise.reject(new Error('缺少 VITE_AMAP_WEB_KEY（高德开放平台 → 应用管理 → Web端(JS API) Key）'))
  }

  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE
  if (securityJsCode) {
    w._AMapSecurityConfig = { securityJsCode }
  }

  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    s.onload = () => resolve()
    s.onerror = () => {
      loadPromise = null
      reject(new Error('高德地图脚本加载失败（网络或被拦截）'))
    }
    document.head.appendChild(s)
  })
  return loadPromise
}

export function getAmapGlobal(): unknown {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as { AMap?: unknown }).AMap
}
