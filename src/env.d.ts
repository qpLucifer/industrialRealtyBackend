/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string
  readonly VITE_API_PROXY_TARGET?: string
  /** Gaode AMap Web JS API key — same console as mini program keys (different key type allowed). */
  readonly VITE_AMAP_WEB_KEY?: string
  /** Optional; required when your Gaode console enables security code for JS API. */
  readonly VITE_AMAP_SECURITY_JS_CODE?: string
  /** COS CI rule without ?; default imageMogr2/format/webp/quality/88; set off to disable */
  readonly VITE_MEDIA_IMAGE_PROCESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
