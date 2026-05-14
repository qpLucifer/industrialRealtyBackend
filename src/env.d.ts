/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Gaode AMap Web JS API key — same console as mini program keys (different key type allowed). */
  readonly VITE_AMAP_WEB_KEY?: string
  /** Optional; required when your Gaode console enables security code for JS API. */
  readonly VITE_AMAP_SECURITY_JS_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
