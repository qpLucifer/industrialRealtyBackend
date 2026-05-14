import { ElLoading } from 'element-plus'

/** Fullscreen loading while OSS uploads are in flight (supports concurrent / sequential calls). */
let uploadLoadingDepth = 0
let uploadLoadingInst: ReturnType<typeof ElLoading.service> | null = null

export const DEFAULT_UPLOAD_LOADING_TEXT = '上传中…'

export function pushUploadLoading(text = DEFAULT_UPLOAD_LOADING_TEXT) {
  uploadLoadingDepth++
  if (uploadLoadingDepth === 1) {
    uploadLoadingInst = ElLoading.service({
      fullscreen: true,
      lock: true,
      text,
      background: 'rgba(255, 255, 255, 0.65)',
    })
  }
}

export function popUploadLoading() {
  if (uploadLoadingDepth <= 0) return
  uploadLoadingDepth--
  if (uploadLoadingDepth === 0 && uploadLoadingInst) {
    uploadLoadingInst.close()
    uploadLoadingInst = null
  }
}
