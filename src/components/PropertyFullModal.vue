<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchCodeMasterItems, fetchPropertyDetail, fetchRegionDefs, publishPropertyApi, savePropertySnapshot, uploadOssFile } from '@/api/admin'
import MapLatLngPicker from '@/components/MapLatLngPicker.vue'
import type { PropertyFullForm, RegionDefRow } from '@/types/domain'
import {
  isPhone11Cn,
  normalizeCnMobileInput,
  onCnMobileCompositionEnd,
  parseOptionalNumber,
  preventNonDigitPhoneBeforeInput,
  preventNonDigitPhoneKeys,
  handleCnMobilePaste,
  sanitizeDigitsDecimal,
  sanitizeDigitsInt,
} from '@/lib/inputValidators'

/** Ensure arrays / flags exist so chips and toggles never throw. */
function ensurePropertyFormShape(f: PropertyFullForm, defaultTypeLabel = '标准厂房') {
  if (!Array.isArray(f.types) || f.types.length === 0) f.types = [defaultTypeLabel]
  if (!Array.isArray(f.photoChecklist)) f.photoChecklist = []
  if (!Array.isArray(f.structureTypes)) f.structureTypes = []
  if (!Array.isArray(f.propertyRights)) f.propertyRights = []
  if (!Array.isArray(f.landUse)) f.landUse = []
  if (!Array.isArray(f.certificates)) f.certificates = []
  if (!Array.isArray(f.fireSystems)) f.fireSystems = []
  if (typeof f.rowMuted !== 'boolean') f.rowMuted = Boolean(f.rowMuted)
  if (f.listTitle === undefined || f.listTitle === null) f.listTitle = ''
  if (f.district === undefined || f.district === null) f.district = ''
  if (f.listingLine1 === undefined || f.listingLine1 === null) f.listingLine1 = ''
  if (f.listingLine2 === undefined || f.listingLine2 === null) f.listingLine2 = ''
  if (f.auditTag === undefined || f.auditTag === null) f.auditTag = '—'
  if (f.auditState === undefined || f.auditState === null) f.auditState = 'draft'
  if (f.auditHint === undefined || f.auditHint === null) f.auditHint = ''
  if (f.riskTag === undefined || f.riskTag === null) f.riskTag = ''
  if (f.submitterName === undefined || f.submitterName === null) f.submitterName = ''
  if (f.contactPhone === undefined || f.contactPhone === null) f.contactPhone = ''
  else f.contactPhone = normalizeCnMobileInput(String(f.contactPhone))
  // Map picker expects string props; API may omit or send numbers.
  if (f.lat === undefined || f.lat === null) f.lat = ''
  else f.lat = String(f.lat).trim()
  if (f.lng === undefined || f.lng === null) f.lng = ''
  else f.lng = String(f.lng).trim()
  if (f.mediaImageUrls == null) f.mediaImageUrls = ''
  else f.mediaImageUrls = String(f.mediaImageUrls)
  if (f.mediaVideoUrls == null) f.mediaVideoUrls = ''
  else f.mediaVideoUrls = String(f.mediaVideoUrls)
}

type RoKey = keyof PropertyFullForm | '_img' | '_vid'

const RO_SECTIONS: { title: string; fields: { key: RoKey; label: string }[] }[] = [
  {
    title: '列表与状态',
    fields: [
      { key: 'code', label: '编号' },
      { key: 'listTitle', label: '列表标题' },
      { key: 'district', label: '所属区域' },
      { key: 'externalStatus', label: '当前状态（草稿 / 待审核 / 驳回 / 上架后租售状态）' },
      { key: 'auditHint', label: '驳回原因 / 审核说明' },
      { key: 'riskTag', label: '风险标签' },
      { key: 'submitterName', label: '提交人' },
    ],
  },
  {
    title: '分类 · 主体 · 地图',
    fields: [
      { key: 'types', label: '房源类型' },
      { key: 'companyName', label: '公司名称' },
      { key: 'address', label: '详细地址' },
      { key: 'lat', label: '纬度' },
      { key: 'lng', label: '经度' },
      { key: 'mapTitle', label: '地图标题' },
      { key: 'ownerContact', label: '业主联系人' },
      { key: 'photoChecklist', label: '现场必拍清单' },
      { key: '_img', label: '图片 URL（每行）' },
      { key: '_vid', label: '视频 URL（每行）' },
    ],
  },
  {
    title: '土地与建筑',
    fields: [
      { key: 'landMu', label: '土地（亩）' },
      { key: 'actualLandMu', label: '实际土地（亩）' },
      { key: 'buildingArea', label: '建筑面积（㎡）' },
      { key: 'actualUseArea', label: '实际使用面积（㎡）' },
      { key: 'floors', label: '总层数' },
      { key: 'loadPerSqm', label: '承重（吨/m²）' },
      { key: 'workshopSize', label: '车间长宽高（米）' },
      { key: 'loadNote', label: '承重注明区域' },
      { key: 'structureTypes', label: '结构类型' },
      { key: 'structureOther', label: '结构 · 其他' },
    ],
  },
  {
    title: '电力 · 货梯 · 配套',
    fields: [
      { key: 'powerKva', label: '电力总容量（kVA）' },
      { key: 'transformers', label: '变压器（台）' },
      { key: 'freightLifts', label: '货梯（台）' },
      { key: 'liftLoadT', label: '货梯载重（吨）' },
      { key: 'liftDims', label: '货梯尺寸（米）' },
      { key: 'platformHeightCm', label: '装卸平台高度（cm）' },
      { key: 'turnRadiusM', label: '转弯半径（米）' },
      { key: 'dormRent', label: '宿舍租金（元/房）' },
      { key: 'dormDistanceKm', label: '宿舍距离（km）' },
      { key: 'dining', label: '餐饮' },
      { key: 'transitStation', label: '公交/地铁站点' },
      { key: 'stationDistanceM', label: '站点距离（米）' },
    ],
  },
  {
    title: '使用情况',
    fields: [
      { key: 'selfUseSqm', label: '自用（㎡）' },
      { key: 'rentEstimateYear', label: '租金估算（元/年）' },
      { key: 'coTenantCount', label: '共租（家）' },
      { key: 'annualRent', label: '年租金（元/年）' },
      { key: 'tenantCompanies', label: '租客公司' },
      { key: 'contractYearsLeft', label: '合同剩余（年）' },
      { key: 'vacantMonths', label: '腾空周期（月）' },
      { key: 'usageRemark', label: '使用情况备注' },
    ],
  },
  {
    title: '产权 · 证件 · 抵押',
    fields: [
      { key: 'propertyRights', label: '产权性质' },
      { key: 'propertyRightsOther', label: '产权 · 其他' },
      { key: 'landUse', label: '土地用途' },
      { key: 'landUseOther', label: '土地用途 · 其他' },
      { key: 'certificates', label: '证件齐全' },
      { key: 'mortgageDispute', label: '抵押/纠纷' },
      { key: 'mortgageNote', label: '抵押/纠纷说明' },
    ],
  },
  {
    title: '交易 · 行业限制',
    fields: [
      { key: 'landlordPriceWan', label: '房东心理价位（万）' },
      { key: 'tradeMode', label: '交易方式' },
      { key: 'taxFeeNote', label: '交易税费说明' },
      { key: 'allowedIndustries', label: '允许产业类型' },
      { key: 'specialLimits', label: '特殊限制' },
    ],
  },
  {
    title: '消防 · 物流',
    fields: [
      { key: 'fireSystems', label: '消防系统' },
      { key: 'fireOther', label: '消防 · 其他' },
      { key: 'firePass', label: '通过验收' },
      { key: 'monitorCoverage', label: '监控覆盖' },
      { key: 'fireFailReason', label: '消防未通过原因' },
      { key: 'highwayKm', label: '最近高速口（km）' },
      { key: 'portAirportKm', label: '港口/机场（km）' },
      { key: 'roadLimits', label: '道路限高/限重' },
      { key: 'rushHour', label: '高峰期拥堵' },
    ],
  },
  {
    title: '政策 · 环保 · 能源',
    fields: [
      { key: 'subsidy', label: '地方产业补贴' },
      { key: 'subsidyDetail', label: '补贴说明' },
      { key: 'taxBenefit', label: '税收优惠' },
      { key: 'envLevel', label: '环评等级' },
      { key: 'dischargePermit', label: '排污许可证' },
      { key: 'solar', label: '光伏' },
    ],
  },
  {
    title: '亮点 · 风险 · 评估',
    fields: [
      { key: 'highlights', label: '厂房亮点' },
      { key: 'risks', label: '潜在风险提示' },
      { key: 'assessment', label: '评估建议' },
    ],
  },
  {
    title: '租售挂牌 · 联系人 · 备注',
    fields: [
      { key: 'rentSaleType', label: '租售类型' },
      { key: 'rentListSqm', label: '租金挂牌（元/㎡·月）' },
      { key: 'propertyFee', label: '物业费（元/㎡·月）' },
      { key: 'contactName', label: '联系人姓名' },
      { key: 'contactPhone', label: '联系人电话' },
      { key: 'viewingNote', label: '看房预约备注' },
      { key: 'internalNote', label: '内部备注' },
    ],
  },
]

const RO_SECTIONS_VIEW_OTHER = RO_SECTIONS.map((sec) => ({
  title: sec.title,
  fields: sec.fields.filter((f) => f.key !== '_img' && f.key !== '_vid'),
})).filter((sec) => sec.fields.length > 0)

function roVal(key: RoKey): string {
  if (key === '_img') return (mediaImageBlock.value || '').trim() || '—'
  if (key === '_vid') return (mediaVideoBlock.value || '').trim() || '—'
  const v = form[key as keyof PropertyFullForm] as unknown
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? '是' : '否'
  if (Array.isArray(v)) return v.length ? v.filter(Boolean).join('、') : '—'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—'
  const s = String(v).trim()
  return s || '—'
}

function isRoMultiline(k: RoKey) {
  return k === '_img' || k === '_vid'
}

/** Two label/value pairs per row; wide fields span full width. */
function roFieldRows(fields: { key: RoKey; label: string }[]) {
  const rows: { key: RoKey; label: string }[][] = []
  let i = 0
  while (i < fields.length) {
    const f = fields[i]
    if (isRoMultiline(f.key)) {
      rows.push([f])
      i += 1
    } else {
      const a = f
      const b = fields[i + 1]
      if (b && !isRoMultiline(b.key)) {
        rows.push([a, b])
        i += 2
      } else {
        rows.push([a])
        i += 1
      }
    }
  }
  return rows
}

const props = defineProps<{
  visible: boolean
  code: string
  mode: 'edit' | 'view'
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const form = reactive<PropertyFullForm>({} as PropertyFullForm)
const tab = ref(0)
const detailViewTab = ref(2)
const uploadingImage = ref(false)
const uploadingVideo = ref(false)
const mediaImageBlock = ref('')
const mediaVideoBlock = ref('')
const regionDefs = ref<RegionDefRow[]>([])

/** Only after audit pass (live) may business listing status (待租/已租/…) be changed. */
const canChangeListingStatus = computed(() => form.auditState === 'live')

/** Draft or rejected: can submit for audit via 发布 */
const canPublishForAudit = computed(() => form.auditState === 'draft' || form.auditState === 'rejected')

function splitMediaLines(block: string) {
  return String(block || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}

const imagePreviewUrls = computed(() => splitMediaLines(mediaImageBlock.value))
const videoPreviewUrls = computed(() => splitMediaLines(mediaVideoBlock.value))

/** OSS/CDN hotlink rules often reject admin Referer; native preview avoids ElImageViewer missing referrerpolicy. */
const imageLightboxOpen = ref(false)
const imageLightboxIdx = ref(0)

function numStr(v: unknown): string {
  if (v == null || v === '') return ''
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  const s = String(v).trim()
  if (!s) return ''
  const n = Number(s)
  return Number.isFinite(n) ? String(n) : ''
}

function setDec(key: keyof PropertyFullForm, e: Event) {
  const s = sanitizeDigitsDecimal((e.target as HTMLInputElement).value)
  const n = parseOptionalNumber(s, true)
  ;(form as Record<string, unknown>)[key as string] = n == null ? 0 : n
}

function setDecNullable(key: 'annualRent' | 'contractYearsLeft' | 'landlordPriceWan', e: Event) {
  const s = sanitizeDigitsDecimal((e.target as HTMLInputElement).value)
  const n = parseOptionalNumber(s, true)
  ;(form as Record<string, unknown>)[key] = n
}

function setInt(key: keyof PropertyFullForm, e: Event) {
  const s = sanitizeDigitsInt((e.target as HTMLInputElement).value)
  const n = s === '' ? 0 : Number.parseInt(s, 10)
  ;(form as Record<string, unknown>)[key as string] = Number.isFinite(n) ? n : 0
}

function sanitizeCoord(raw: string): string {
  return String(raw || '').replace(/[^\d.\-]/g, '')
}

function onCoordInput(which: 'lat' | 'lng', e: Event) {
  const v = sanitizeCoord((e.target as HTMLInputElement).value).slice(0, 20)
  form[which] = v
}

function onPhone11Input(e: Event) {
  form.contactPhone = normalizeCnMobileInput((e.target as HTMLInputElement).value)
}

const structureOtherDisabled = computed(() => !form.structureTypes?.includes('其他'))
const rightsOtherDisabled = computed(() => !form.propertyRights?.includes('其他'))
const landUseOtherDisabled = computed(() => !form.landUse?.includes('其他'))
const fireOtherDisabled = computed(() => !form.fireSystems?.includes('其他'))
const subsidyDetailDisabled = computed(() => form.subsidy !== '有')
const mortgageNoteDisabled = computed(() => form.mortgageDispute === '无')
/** Reason applies when acceptance is not passed */
const fireFailReasonDisabled = computed(() => form.firePass !== '否')

function openImageLightbox(i: number) {
  const urls = imagePreviewUrls.value
  if (!urls.length) return
  imageLightboxIdx.value = Math.min(Math.max(0, i), urls.length - 1)
  imageLightboxOpen.value = true
}

function stepImageLightbox(delta: number) {
  const urls = imagePreviewUrls.value
  if (!urls.length) return
  imageLightboxIdx.value = (imageLightboxIdx.value + delta + urls.length) % urls.length
}

const imageLightboxSrc = computed(() => imagePreviewUrls.value[imageLightboxIdx.value] || '')

watch(imagePreviewUrls, (urls) => {
  if (!urls.length) imageLightboxOpen.value = false
  else if (imageLightboxIdx.value >= urls.length) imageLightboxIdx.value = urls.length - 1
})

const FALLBACK_PROPERTY_TYPES = ['标准厂房', '独门独院厂房', '仓库', '工业用地', '写字楼', '产业园商铺']
const FALLBACK_LISTING_STATUSES = ['待租', '已租', '待售', '已售', '意向中', '下架封存']

const propertyTypeLabels = ref<string[]>([...FALLBACK_PROPERTY_TYPES])
const listingStatusLabels = ref<string[]>([...FALLBACK_LISTING_STATUSES])
const photoOptions = ['门口形象照', '路口进出照', '车间照片', '货梯', '厂房屋顶'] as const
const structureOptions = ['钢构', '框架', '其他'] as const
const rightsOptions = ['国有土地', '出让', '划拨', '集体土地', '其他'] as const
const landUseOptions = ['工业', '仓储', '其他'] as const
const certOptions = ['房产证', '土地证', '消防验收证', '环保批文'] as const
const fireOptions = ['喷淋', '烟感', '消防栓', '其他'] as const

function toggle(arr: string[], v: string) {
  const i = arr.indexOf(v)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(v)
}

function isVideoUrl(line: string) {
  return /\.(mp4|mpe?g|webm|mov|m4v|avi)(\?.*)?$/i.test(String(line || '').trim())
}

function syncMediaBlocksFromForm() {
  let imgLines = String(form.mediaImageUrls ?? '').trim()
  let vidLines = String(form.mediaVideoUrls ?? '').trim()
  if (!imgLines && !vidLines && form.mediaUrls) {
    const lines = String(form.mediaUrls || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    imgLines = lines.filter((l) => !isVideoUrl(l)).join('\n')
    vidLines = lines.filter((l) => isVideoUrl(l)).join('\n')
  }
  mediaImageBlock.value = imgLines
  mediaVideoBlock.value = vidLines
}

function mergeMediaBlocksToForm() {
  const imgs = mediaImageBlock.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const vids = mediaVideoBlock.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  form.mediaImageUrls = imgs.join('\n')
  form.mediaVideoUrls = vids.join('\n')
  form.mediaUrls = [...imgs, ...vids].join('\n')
}

watch(
  () => [props.visible, props.code] as const,
  async ([vis, code]) => {
    if (!vis) return
    detailViewTab.value = 2
    const [regions, detail, typeCm, listingCm] = await Promise.all([
      fetchRegionDefs(),
      fetchPropertyDetail(code),
      fetchCodeMasterItems('property_type').catch(() => ({ list: [] as { label: string }[] })),
      fetchCodeMasterItems('property_listing_status').catch(() => ({ list: [] as { label: string }[] })),
    ])
    const { list } = regions
    const d = detail
    if (typeCm.list?.length) propertyTypeLabels.value = typeCm.list.map((r) => r.label)
    else propertyTypeLabels.value = [...FALLBACK_PROPERTY_TYPES]
    if (listingCm.list?.length) listingStatusLabels.value = listingCm.list.map((r) => r.label)
    else listingStatusLabels.value = [...FALLBACK_LISTING_STATUSES]
    regionDefs.value = list
    Object.assign(form, d)
    ensurePropertyFormShape(form, propertyTypeLabels.value[0] || '标准厂房')
    syncMediaBlocksFromForm()
  },
)

function close() {
  emit('update:visible', false)
}

function onBackdropClick() {
  if (props.mode === 'edit') return
  close()
}

function setTab(i: number) {
  tab.value = i
}

async function onSave() {
  if (props.mode !== 'edit') return
  mergeMediaBlocksToForm()
  const miss = collectPropertyRequiredMiss()
  if (miss.length) {
    ElMessage.error(`请完善必填项：${miss.join('、')}`)
    return
  }
  if (String(form.listTitle || '').length > 120) {
    ElMessage.error('列表标题不超过 120 字')
    return
  }
  if (String(form.address || '').length > 200) {
    ElMessage.error('详细地址不超过 200 字')
    return
  }
  if (!isPhone11Cn(String(form.contactPhone || ''))) {
    ElMessage.error('联系人电话须为 11 位数字（1 开头）')
    return
  }
  await savePropertySnapshot({ ...form, mode: props.mode, code: props.code })
  ElMessage.success('房源已保存')
  emit('saved')
  close()
}

function collectPropertyRequiredMiss(): string[] {
  const miss: string[] = []
  if (!String(form.listTitle || '').trim()) miss.push('列表标题')
  if (!Array.isArray(form.types) || !form.types.length) miss.push('房源类型')
  if (!String(form.companyName || '').trim()) miss.push('公司名称')
  if (!String(form.address || '').trim()) miss.push('详细地址')
  if (!String(form.lat || '').trim() || !String(form.lng || '').trim()) miss.push('地图坐标（GCJ-02 纬经度）')
  if (!Array.isArray(form.photoChecklist) || !form.photoChecklist.length) miss.push('现场必拍清单')
  const hasImg = mediaImageBlock.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length
  const hasVid = mediaVideoBlock.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean).length
  if (!hasImg && !hasVid) miss.push('图片或视频 URL（至少一类）')
  if (form.landMu == null || Number(form.landMu) <= 0) miss.push('土地（亩）')
  if (form.powerKva == null || Number(form.powerKva) <= 0) miss.push('电力总容量')
  if (!String(form.rentSaleType || '').trim()) miss.push('租售类型')
  if (!String(form.contactName || '').trim()) miss.push('联系人姓名')
  if (!String(form.contactPhone || '').trim()) miss.push('联系人电话')
  return miss
}

async function reloadPropertyForm() {
  const d = await fetchPropertyDetail(props.code)
  Object.assign(form, d)
  ensurePropertyFormShape(form, propertyTypeLabels.value[0] || '标准厂房')
  syncMediaBlocksFromForm()
}

async function onPublish() {
  if (props.mode !== 'edit') return
  mergeMediaBlocksToForm()
  const miss = collectPropertyRequiredMiss()
  if (miss.length) {
    ElMessage.error(`发布前请完善：${miss.join('、')}`)
    return
  }
  if (String(form.listTitle || '').length > 120) {
    ElMessage.error('列表标题不超过 120 字')
    return
  }
  if (String(form.address || '').length > 200) {
    ElMessage.error('详细地址不超过 200 字')
    return
  }
  if (!isPhone11Cn(String(form.contactPhone || ''))) {
    ElMessage.error('联系人电话须为 11 位数字（1 开头）')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确定提交发布？提交后房源将进入「待审核」队列，管理员审核通过后为「待租」，驳回需填写原因。',
      '确认发布',
      { type: 'warning', confirmButtonText: '确认发布', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await savePropertySnapshot({ ...form, mode: props.mode, code: props.code })
    await publishPropertyApi({ code: props.code })
    ElMessage.success('已提交发布，进入待审核')
    emit('saved')
    await reloadPropertyForm()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '发布失败')
  }
}

function onTogglePhoto(p: string) {
  if (props.mode === 'view') return
  toggle(form.photoChecklist, p)
}

function onToggleType(t: string) {
  if (props.mode === 'view') return
  toggle(form.types, t)
}

async function onPickImages(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  uploadingImage.value = true
  try {
    const folder = `properties/${encodeURIComponent(props.code)}/images`
    const lines = mediaImageBlock.value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    for (const file of Array.from(files)) {
      const { url } = await uploadOssFile(file, folder)
      lines.push(url)
    }
    mediaImageBlock.value = lines.join('\n')
    ElMessage.success(`已上传 ${files.length} 张图片`)
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '上传失败')
  } finally {
    uploadingImage.value = false
    input.value = ''
  }
}

async function onPickVideos(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  uploadingVideo.value = true
  try {
    const folder = `properties/${encodeURIComponent(props.code)}/videos`
    const lines = mediaVideoBlock.value
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    for (const file of Array.from(files)) {
      const { url } = await uploadOssFile(file, folder)
      lines.push(url)
    }
    mediaVideoBlock.value = lines.join('\n')
    ElMessage.success(`已上传 ${files.length} 个视频`)
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '上传失败')
  } finally {
    uploadingVideo.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="property-full-modal-host">
  <Teleport to="body">
    <div class="modal-center" :class="{ show: visible }" @click.self="onBackdropClick">
      <div class="modal-box modal-prop-box">
        <div class="modal-prop-head">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px">
            <div>
              <h3 style="margin: 0">
                {{ mode === 'edit' ? '编辑房源 · #' + code : '房源详情 · #' + code }}
              </h3>
            </div>
            <button type="button" class="modal-close-icon" aria-label="关闭" @click="close">×</button>
          </div>
          <div v-if="mode === 'edit'" class="admin-modal-tabs" data-skip-tap>
            <button type="button" :class="{ active: tab === 0 }" @click="setTab(0)">分类 · 基础 · 清单</button>
            <button type="button" :class="{ active: tab === 1 }" @click="setTab(1)">地图定位</button>
            <button type="button" :class="{ active: tab === 2 }" @click="setTab(2)">图片</button>
            <button type="button" :class="{ active: tab === 3 }" @click="setTab(3)">视频</button>
            <button type="button" :class="{ active: tab === 4 }" @click="setTab(4)">土地 · 配套 · 使用</button>
            <button type="button" :class="{ active: tab === 5 }" @click="setTab(5)">产权 · 合规</button>
            <button type="button" :class="{ active: tab === 6 }" @click="setTab(6)">内部跟进</button>
          </div>
        </div>
        <div class="modal-prop-scroll">
          <template v-if="mode === 'edit'">
          <div class="prop-admin-panel" :class="{ active: tab === 0 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">列表与状态</div>
              <div class="full">
                <label>当前状态（列表「状态」列）</label>
                <template v-if="canChangeListingStatus">
                  <select v-model="form.externalStatus" class="status-select">
                    <option v-for="s in listingStatusLabels" :key="s">{{ s }}</option>
                  </select>
                  <p class="hint" style="margin-top: 6px">
                    审核已通过，可在此切换对外租售状态；保存后写入列表「状态」列。
                  </p>
                </template>
                <template v-else>
                  <input :value="String(form.externalStatus || '草稿')" type="text" class="ro-input-readonly" readonly tabindex="-1" />
                  <p class="hint" style="margin-top: 6px">
                    未发布为「草稿」；点底部「发布」后为「待审核」；审核通过为「待租」；驳回为「驳回」并显示原因。
                  </p>
                </template>
              </div>
              <div v-if="form.auditState === 'rejected'" class="full">
                <label>驳回原因</label>
                <textarea :value="String(form.auditHint || '')" class="ro-input-readonly" rows="3" readonly tabindex="-1" />
              </div>
              <div class="full">
                <label>列表标题（房源列）<span style="color: var(--rose)">*</span></label>
                <input v-model="form.listTitle" type="text" maxlength="120" placeholder="例：黄埔科学城 · 单层厂房" />
                <span class="hint" style="font-size: 11px">{{ String(form.listTitle || '').length }}/120</span>
              </div>
              <div class="full">
                <label>所属区域（与员工负责区域一致）</label>
                <el-select
                  v-model="form.district"
                  clearable
                  placeholder="请选择区县"
                  style="width: 100%; margin-top: 6px"
                >
                  <el-option v-for="d in regionDefs" :key="d.id" :label="d.name" :value="d.name" />
                </el-select>
                <p class="hint" style="margin-top: 6px">选项来自「区域名称」页维护的名称，与员工负责区域、列表筛选一致。</p>
              </div>
              <div>
                <label>提交人（列表）</label>
                <input v-model="form.submitterName" type="text" maxlength="40" placeholder="业务员姓名" />
              </div>
              <div class="full">
                <label>风险标签</label>
                <input v-model="form.riskTag" type="text" maxlength="64" placeholder="如：资料待核、无、首次发布" />
              </div>
              <div class="form-section-h" style="margin-top: 8px">分类 · 基础 · 清单</div>
              <div class="full">
                <label>房源类型（多选）<span style="color: var(--rose)">*</span></label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="t in propertyTypeLabels"
                    :key="t"
                    :class="{ on: form.types?.includes(t) }"
                    @click="onToggleType(t)"
                    >{{ t }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>公司名称<span style="color: var(--rose)">*</span></label>
                <input v-model="form.companyName" type="text" maxlength="120" />
              </div>
              <div class="full">
                <label>详细地址<span style="color: var(--rose)">*</span></label>
                <input v-model="form.address" type="text" maxlength="200" />
                <span class="hint" style="font-size: 11px">{{ String(form.address || '').length }}/200</span>
              </div>
              <div class="full">
                <label>业主联系人</label>
                <input v-model="form.ownerContact" type="text" maxlength="40" />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 1 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">地图定位（小程序房源详情底部展示）</div>
              <div>
                <label>纬度（GCJ-02）<span style="color: var(--rose)">*</span></label>
                <input
                  :value="form.lat"
                  type="text"
                  maxlength="20"
                  placeholder="例：23.179455"
                  inputmode="decimal"
                  @input="onCoordInput('lat', $event)"
                />
              </div>
              <div>
                <label>经度（GCJ-02）<span style="color: var(--rose)">*</span></label>
                <input
                  :value="form.lng"
                  type="text"
                  maxlength="20"
                  placeholder="例：113.429512"
                  inputmode="decimal"
                  @input="onCoordInput('lng', $event)"
                />
              </div>
              <div class="full">
                <MapLatLngPicker
                  v-if="tab === 1"
                  :key="`${code}-${form.lat}-${form.lng}`"
                  v-model:lat="form.lat"
                  v-model:lng="form.lng"
                  :disabled="false"
                />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 2 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">图片 · 现场必拍</div>
              <div class="full">
                <label>现场必拍清单（多选）<span style="color: var(--rose)">*</span></label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="p in photoOptions"
                    :key="p"
                    :class="{ on: form.photoChecklist?.includes(p) }"
                    @click="onTogglePhoto(p)"
                    >{{ p }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>图片 URL（每行一条）<span style="color: var(--rose)">*</span></label>
                <textarea v-model="mediaImageBlock" rows="5" placeholder="https://…jpg / png / webp" />
              </div>
              <div class="full">
                <input type="file" accept="image/*" multiple :disabled="uploadingImage" @change="onPickImages" />
              </div>
              <div v-if="imagePreviewUrls.length" class="full media-preview-block">
                <label>预览（点击放大）</label>
                <div class="media-preview-grid">
                  <img
                    v-for="(url, i) in imagePreviewUrls"
                    :key="`${url}-${i}`"
                    :src="url"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt=""
                    class="media-thumb media-thumb-native"
                    role="button"
                    tabindex="0"
                    @click="openImageLightbox(i)"
                    @keyup.enter="openImageLightbox(i)"
                  />
                </div>
              </div>
              <p v-else class="hint full" style="margin: 0">填写 URL 或上传后将在此显示缩略图。</p>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 3 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">视频 URL 与上传</div>
              <div class="full">
                <label>视频 URL（每行一条）</label>
                <textarea v-model="mediaVideoBlock" rows="4" placeholder="https://…mp4 / mov（可与图片同时存在）" />
              </div>
              <div class="full">
                <input type="file" accept="video/*" multiple :disabled="uploadingVideo" @change="onPickVideos" />
              </div>
              <div v-if="videoPreviewUrls.length" class="full media-preview-block">
                <label>预览</label>
                <div class="media-video-list">
                  <div v-for="(url, i) in videoPreviewUrls" :key="`${url}-${i}`" class="media-video-item">
                    <video :src="url" controls preload="metadata" class="media-video" referrerpolicy="no-referrer" />
                    <a class="media-video-link" :href="url" target="_blank" rel="noopener noreferrer">新窗口打开</a>
                  </div>
                </div>
              </div>
              <p v-else class="hint full" style="margin: 0">填写 URL 或上传后将在此显示播放器。</p>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 4 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">2. 土地与建筑规格</div>
              <div>
                <label>土地（亩）<span style="color: var(--rose)">*</span></label>
                <input :value="numStr(form.landMu)" type="text" inputmode="decimal" maxlength="14" @input="setDec('landMu', $event)" />
              </div>
              <div>
                <label>实际土地（亩）</label>
                <input
                  :value="numStr(form.actualLandMu)"
                  type="text"
                  inputmode="decimal"
                  maxlength="14"
                  @input="setDec('actualLandMu', $event)"
                />
              </div>
              <div>
                <label>建筑面积（㎡）</label>
                <input :value="numStr(form.buildingArea)" type="text" inputmode="numeric" maxlength="12" @input="setInt('buildingArea', $event)" />
              </div>
              <div>
                <label>实际使用面积（㎡）</label>
                <input
                  :value="numStr(form.actualUseArea)"
                  type="text"
                  inputmode="numeric"
                  maxlength="12"
                  @input="setInt('actualUseArea', $event)"
                />
              </div>
              <div>
                <label>总层数（层）</label>
                <input :value="numStr(form.floors)" type="text" inputmode="numeric" maxlength="6" @input="setInt('floors', $event)" />
              </div>
              <div>
                <label>承重能力（吨/m²）</label>
                <input :value="numStr(form.loadPerSqm)" type="text" inputmode="decimal" maxlength="12" @input="setDec('loadPerSqm', $event)" />
              </div>
              <div class="full">
                <label>车间长宽高（米）</label>
                <input v-model="form.workshopSize" type="text" />
              </div>
              <div class="full">
                <label>承重注明区域</label>
                <input v-model="form.loadNote" type="text" />
              </div>
              <div class="full">
                <label>结构类型（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="s in structureOptions"
                    :key="s"
                    :class="{ on: form.structureTypes?.includes(s) }"
                    @click="toggle(form.structureTypes, s)"
                    >{{ s }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>结构 · 其他说明</label>
                <input v-model="form.structureOther" type="text" placeholder="选其他时填写" :disabled="structureOtherDisabled" />
              </div>

              <div class="form-section-h">3. 电力与货运设施</div>
              <div>
                <label>电力总容量（kVA）<span style="color: var(--rose)">*</span></label>
                <input :value="numStr(form.powerKva)" type="text" inputmode="numeric" maxlength="10" @input="setInt('powerKva', $event)" />
              </div>
              <div>
                <label>现有变压器（台）</label>
                <input :value="numStr(form.transformers)" type="text" inputmode="numeric" maxlength="6" @input="setInt('transformers', $event)" />
              </div>
              <div>
                <label>货梯（台）</label>
                <input :value="numStr(form.freightLifts)" type="text" inputmode="numeric" maxlength="6" @input="setInt('freightLifts', $event)" />
              </div>
              <div>
                <label>货梯载重（吨）</label>
                <input :value="numStr(form.liftLoadT)" type="text" inputmode="decimal" maxlength="10" @input="setDec('liftLoadT', $event)" />
              </div>
              <div class="full">
                <label>货梯长宽高（米）</label>
                <input v-model="form.liftDims" type="text" />
              </div>
              <div>
                <label>装卸平台高度（cm）</label>
                <input
                  :value="numStr(form.platformHeightCm)"
                  type="text"
                  inputmode="numeric"
                  maxlength="8"
                  @input="setInt('platformHeightCm', $event)"
                />
              </div>
              <div>
                <label>货车转弯半径（米）</label>
                <input :value="numStr(form.turnRadiusM)" type="text" inputmode="decimal" maxlength="10" @input="setDec('turnRadiusM', $event)" />
              </div>

              <div class="form-section-h">4. 周边配套<span style="color: var(--rose)">*</span></div>
              <div>
                <label>宿舍 · 园区内租金（元/房）</label>
                <input :value="numStr(form.dormRent)" type="text" inputmode="numeric" maxlength="10" placeholder="可选" @input="setInt('dormRent', $event)" />
              </div>
              <div>
                <label>宿舍 · 周边距离（公里）</label>
                <input
                  :value="numStr(form.dormDistanceKm)"
                  type="text"
                  inputmode="decimal"
                  maxlength="10"
                  placeholder="可选"
                  @input="setDec('dormDistanceKm', $event)"
                />
              </div>
              <div>
                <label>餐饮 / 便利店</label>
                <select v-model="form.dining" style="margin-top: 5px">
                  <option>集中</option>
                  <option>分散</option>
                  <option>缺乏</option>
                </select>
              </div>
              <div>
                <label>公交 / 地铁最近站点</label>
                <input v-model="form.transitStation" type="text" />
              </div>
              <div>
                <label>站点距离（米）</label>
                <input
                  :value="numStr(form.stationDistanceM)"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  @input="setInt('stationDistanceM', $event)"
                />
              </div>

              <div class="form-section-h">5. 使用情况<span style="color: var(--rose)">*</span></div>
              <div>
                <label>自用（㎡）</label>
                <input :value="numStr(form.selfUseSqm)" type="text" inputmode="numeric" maxlength="12" @input="setInt('selfUseSqm', $event)" />
              </div>
              <div>
                <label>租金估算（元/年）</label>
                <input
                  :value="numStr(form.rentEstimateYear)"
                  type="text"
                  inputmode="numeric"
                  maxlength="14"
                  @input="setInt('rentEstimateYear', $event)"
                />
              </div>
              <div>
                <label>共租（家）</label>
                <input :value="numStr(form.coTenantCount)" type="text" inputmode="numeric" maxlength="6" @input="setInt('coTenantCount', $event)" />
              </div>
              <div>
                <label>年租金（元/年）</label>
                <input
                  :value="numStr(form.annualRent)"
                  type="text"
                  inputmode="numeric"
                  maxlength="14"
                  placeholder="共租时"
                  @input="setDecNullable('annualRent', $event)"
                />
              </div>
              <div class="full">
                <label>租客公司名称</label>
                <input v-model="form.tenantCompanies" type="text" placeholder="多家顿号分隔" />
              </div>
              <div>
                <label>合同还有（年）</label>
                <input
                  :value="numStr(form.contractYearsLeft)"
                  type="text"
                  inputmode="decimal"
                  maxlength="8"
                  @input="setDecNullable('contractYearsLeft', $event)"
                />
              </div>
              <div>
                <label>厂房全部腾空（月）</label>
                <input :value="numStr(form.vacantMonths)" type="text" inputmode="numeric" maxlength="6" @input="setInt('vacantMonths', $event)" />
              </div>
              <div class="full">
                <label>使用情况备注</label>
                <textarea v-model="form.usageRemark" rows="2" />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 5 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">7. 产权性质<span style="color: var(--rose)">*</span></div>
              <div class="full">
                <label>产权性质（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="r in rightsOptions"
                    :key="r"
                    :class="{ on: form.propertyRights?.includes(r) }"
                    @click="toggle(form.propertyRights, r)"
                    >{{ r }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>产权 · 其他说明</label>
                <input v-model="form.propertyRightsOther" type="text" :disabled="rightsOtherDisabled" />
              </div>
              <div class="full">
                <label>土地用途（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="u in landUseOptions"
                    :key="u"
                    :class="{ on: form.landUse?.includes(u) }"
                    @click="toggle(form.landUse, u)"
                    >{{ u }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>土地用途 · 其他</label>
                <input v-model="form.landUseOther" type="text" :disabled="landUseOtherDisabled" />
              </div>
              <div class="full">
                <label>证件齐全（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="c in certOptions"
                    :key="c"
                    :class="{ on: form.certificates?.includes(c) }"
                    @click="toggle(form.certificates, c)"
                    >{{ c }}</span
                  >
                </div>
              </div>
              <div>
                <label>抵押 / 纠纷</label>
                <select v-model="form.mortgageDispute" style="margin-top: 5px">
                  <option>无</option>
                  <option>有</option>
                </select>
              </div>
              <div class="full">
                <label>抵押 / 纠纷说明</label>
                <textarea v-model="form.mortgageNote" rows="2" :disabled="mortgageNoteDisabled" />
              </div>

              <div class="form-section-h">8. 交易条款<span style="color: var(--rose)">*</span> · 税费</div>
              <div>
                <label>房东心里价位（万）</label>
                <input
                  :value="numStr(form.landlordPriceWan)"
                  type="text"
                  inputmode="decimal"
                  maxlength="14"
                  @input="setDecNullable('landlordPriceWan', $event)"
                />
              </div>
              <div>
                <label>厂房交易方式</label>
                <input v-model="form.tradeMode" type="text" />
              </div>
              <div class="full">
                <label>交易税费大概金额</label>
                <input v-model="form.taxFeeNote" type="text" placeholder="金额或区间" />
              </div>

              <div class="form-section-h">9. 行业限制</div>
              <div class="full">
                <label>允许产业类型</label>
                <input v-model="form.allowedIndustries" type="text" />
              </div>
              <div class="full">
                <label>特殊限制</label>
                <textarea v-model="form.specialLimits" rows="2" />
              </div>

              <div class="form-section-h">10. 消防与安全</div>
              <div class="full">
                <label>消防系统（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="f in fireOptions"
                    :key="f"
                    :class="{ on: form.fireSystems?.includes(f) }"
                    @click="toggle(form.fireSystems, f)"
                    >{{ f }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>消防 · 其他</label>
                <input v-model="form.fireOther" type="text" :disabled="fireOtherDisabled" />
              </div>
              <div>
                <label>通过验收</label>
                <select v-model="form.firePass" style="margin-top: 5px">
                  <option>是</option>
                  <option>否</option>
                </select>
              </div>
              <div>
                <label>监控覆盖</label>
                <select v-model="form.monitorCoverage" style="margin-top: 5px">
                  <option>全厂区</option>
                  <option>部分区域</option>
                </select>
              </div>
              <div class="full">
                <label>消防未通过原因</label>
                <input v-model="form.fireFailReason" type="text" :disabled="fireFailReasonDisabled" />
              </div>

              <div class="form-section-h">11. 物流便捷度</div>
              <div>
                <label>最近高速口（km）</label>
                <input :value="numStr(form.highwayKm)" type="text" inputmode="decimal" maxlength="10" @input="setDec('highwayKm', $event)" />
              </div>
              <div>
                <label>港口/机场（km）</label>
                <input :value="numStr(form.portAirportKm)" type="text" inputmode="decimal" maxlength="10" @input="setDec('portAirportKm', $event)" />
              </div>
              <div class="full">
                <label>周边道路限高/限重</label>
                <input v-model="form.roadLimits" type="text" />
              </div>
              <div>
                <label>高峰期拥堵</label>
                <select v-model="form.rushHour" style="margin-top: 5px">
                  <option>无</option>
                  <option>轻度</option>
                  <option>严重</option>
                </select>
              </div>

              <div class="form-section-h">12. 政策支持</div>
              <div>
                <label>地方产业补贴</label>
                <select v-model="form.subsidy" style="margin-top: 5px">
                  <option>无</option>
                  <option>有</option>
                </select>
              </div>
              <div class="full">
                <label>补贴具体说明</label>
                <input v-model="form.subsidyDetail" type="text" :disabled="subsidyDetailDisabled" />
              </div>
              <div class="full">
                <label>税收优惠</label>
                <input v-model="form.taxBenefit" type="text" />
              </div>

              <div class="form-section-h">13. 环保与能源</div>
              <div class="full">
                <label>环评等级</label>
                <input v-model="form.envLevel" type="text" />
              </div>
              <div>
                <label>排污许可证</label>
                <select v-model="form.dischargePermit" style="margin-top: 5px">
                  <option>有</option>
                  <option>无</option>
                </select>
              </div>
              <div>
                <label>光伏安装</label>
                <select v-model="form.solar" style="margin-top: 5px">
                  <option>可接入</option>
                  <option>不可接入</option>
                </select>
              </div>

              <div class="form-section-h">备注栏</div>
              <div class="full">
                <label>厂房亮点</label>
                <textarea v-model="form.highlights" rows="2" />
              </div>
              <div class="full">
                <label>潜在风险提示</label>
                <textarea v-model="form.risks" rows="2" />
              </div>
              <div class="full">
                <label>厂房评估建议</label>
                <textarea v-model="form.assessment" rows="2" />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 6 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">内部跟进</div>
              <div>
                <label>租售类型<span style="color: var(--rose)">*</span></label>
                <select v-model="form.rentSaleType">
                  <option>出租</option>
                  <option>出售</option>
                  <option>租售皆可</option>
                </select>
              </div>
              <div>
                <label>租金挂牌（元/㎡·月）</label>
                <input :value="numStr(form.rentListSqm)" type="text" inputmode="decimal" maxlength="12" @input="setDec('rentListSqm', $event)" />
              </div>
              <div>
                <label>物业费（元/㎡·月）</label>
                <input :value="numStr(form.propertyFee)" type="text" inputmode="decimal" maxlength="12" @input="setDec('propertyFee', $event)" />
              </div>
              <div>
                <label>联系人姓名<span style="color: var(--rose)">*</span></label>
                <input v-model="form.contactName" type="text" />
              </div>
              <div>
                <label>联系人电话<span style="color: var(--rose)">*</span></label>
                <input
                  :value="form.contactPhone"
                  type="tel"
                  inputmode="numeric"
                  maxlength="11"
                  lang="en"
                  pattern="[0-9]*"
                  placeholder="11 位手机号"
                  autocomplete="tel"
                  @beforeinput="preventNonDigitPhoneBeforeInput"
                  @compositionend="onCnMobileCompositionEnd($event as CompositionEvent, (v) => (form.contactPhone = v))"
                  @keydown="preventNonDigitPhoneKeys"
                  @paste="handleCnMobilePaste($event as ClipboardEvent, () => form.contactPhone, (v) => (form.contactPhone = v))"
                  @input="onPhone11Input"
                />
              </div>
              <div class="full">
                <label>看房预约备注</label>
                <textarea v-model="form.viewingNote" rows="2" />
              </div>
              <div class="full">
                <label>内部备注（不对客户）</label>
                <textarea v-model="form.internalNote" rows="4" placeholder="团队内部记录、谈判进展等" />
              </div>
            </div>
          </div>
          </template>
          <div v-else class="prop-readonly-summary">
            <div v-if="mode === 'view'" class="admin-modal-tabs" data-skip-tap style="margin-bottom: 14px">
              <button type="button" :class="{ active: detailViewTab === 2 }" @click="detailViewTab = 2">房源明细</button>
              <button type="button" :class="{ active: detailViewTab === 0 }" @click="detailViewTab = 0">图片</button>
              <button type="button" :class="{ active: detailViewTab === 1 }" @click="detailViewTab = 1">视频</button>
            </div>

            <div v-show="detailViewTab === 0">
              <p v-if="!imagePreviewUrls.length" class="hint" style="margin: 0">暂无图片。</p>
              <div v-else class="media-preview-block">
                <label>图片预览（点击放大）</label>
                <div class="media-preview-grid">
                  <img
                    v-for="(url, i) in imagePreviewUrls"
                    :key="`v-${url}-${i}`"
                    :src="url"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt=""
                    class="media-thumb media-thumb-native"
                    role="button"
                    tabindex="0"
                    @click="openImageLightbox(i)"
                    @keyup.enter="openImageLightbox(i)"
                  />
                </div>
              </div>
            </div>

            <div v-show="detailViewTab === 1">
              <p v-if="!videoPreviewUrls.length" class="hint" style="margin: 0">暂无视频。</p>
              <div v-else class="media-preview-block">
                <label>视频预览</label>
                <div class="media-video-list">
                  <div v-for="(url, i) in videoPreviewUrls" :key="`vv-${url}-${i}`" class="media-video-item">
                    <video :src="url" controls preload="metadata" class="media-video" referrerpolicy="no-referrer" />
                    <a class="media-video-link" :href="url" target="_blank" rel="noopener noreferrer">新窗口打开</a>
                  </div>
                </div>
              </div>
            </div>

            <div v-show="detailViewTab === 2">
              <p class="hint" style="margin: 0 0 14px">与编辑表单字段一致（不含上方图片/视频 Tab 已展示内容）。</p>
              <section v-for="sec in RO_SECTIONS_VIEW_OTHER" :key="sec.title" class="ro-sec">
                <h4 class="ro-h4">{{ sec.title }}</h4>
                <div
                  v-for="(row, ri) in roFieldRows(sec.fields)"
                  :key="`${sec.title}-${ri}`"
                  class="ro-row"
                  :class="{ 'ro-row-span': row.length === 1 && isRoMultiline(row[0].key) }"
                >
                  <template v-for="f in row" :key="f.key">
                    <dt>{{ f.label }}</dt>
                    <dd
                      :class="{
                        'ro-dd-multiline': f.key === '_img' || f.key === '_vid',
                      }"
                    >
                      {{ roVal(f.key) }}
                    </dd>
                  </template>
                  <template v-if="row.length === 1 && !isRoMultiline(row[0].key)">
                    <span class="ro-dt-ph" aria-hidden="true" />
                    <span class="ro-dd-ph" aria-hidden="true" />
                  </template>
                </div>
              </section>
            </div>
          </div>
        </div>
        <div class="modal-prop-foot" style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap">
          <button type="button" class="btn" @click="close">关闭</button>
          <div style="display: flex; gap: 10px; flex-wrap: wrap">
            <button v-if="mode === 'edit' && canPublishForAudit" type="button" class="btn" @click="onPublish">发布</button>
            <button v-if="mode === 'edit'" type="button" class="btn btn-primary" @click="onSave">保存修改</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <el-dialog
    v-model="imageLightboxOpen"
    title="图片预览"
    width="min(94vw, 960px)"
    append-to-body
    destroy-on-close
    class="prop-img-lightbox"
    align-center
  >
    <div v-if="imagePreviewUrls.length" class="lightbox-inner">
      <img :src="imageLightboxSrc" referrerpolicy="no-referrer" class="lightbox-img" alt="" />
      <div class="lightbox-toolbar">
        <el-button :disabled="imagePreviewUrls.length < 2" @click="stepImageLightbox(-1)">上一张</el-button>
        <span class="lightbox-pos">{{ imageLightboxIdx + 1 }} / {{ imagePreviewUrls.length }}</span>
        <el-button :disabled="imagePreviewUrls.length < 2" @click="stepImageLightbox(1)">下一张</el-button>
      </div>
    </div>
  </el-dialog>
  </div>
</template>

<style scoped>
.property-full-modal-host {
  display: contents;
}
.prop-readonly-summary {
  padding: 8px 4px 16px;
  max-height: min(70vh, 640px);
  overflow-y: auto;
}
.ro-sec {
  margin-bottom: 18px;
}
.ro-h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}
.ro-row {
  display: grid;
  grid-template-columns: minmax(88px, 0.85fr) 1.15fr minmax(88px, 0.85fr) 1.15fr;
  gap: 6px 12px;
  align-items: start;
  margin: 0 0 10px;
  font-size: 13px;
}
.ro-row-span {
  grid-template-columns: minmax(88px, 0.22fr) 1fr;
}
.ro-row dt {
  margin: 0;
  color: #64748b;
  font-weight: 600;
}
.ro-row dd {
  margin: 0;
  color: #1e293b;
  word-break: break-word;
}
.ro-dt-ph,
.ro-dd-ph {
  display: block;
  min-height: 1px;
}
.ro-dd-multiline {
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.45;
}
.ro-input-readonly {
  width: 100%;
  margin-top: 5px;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 8px;
  background: #e2e8f0;
  color: #1e293b;
  font-size: 13px;
  cursor: default;
}
textarea.ro-input-readonly {
  min-height: 72px;
  resize: none;
}
.ro-pre {
  margin: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.media-preview-block label {
  display: block;
  margin-bottom: 8px;
}
.media-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.media-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  cursor: zoom-in;
}
.media-thumb-native {
  object-fit: cover;
  display: block;
  background: #f1f5f9;
}
.lightbox-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.lightbox-img {
  max-width: 100%;
  max-height: min(72vh, 720px);
  object-fit: contain;
  border-radius: 8px;
  background: #0f172a;
}
.lightbox-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.lightbox-pos {
  font-size: 13px;
  color: #64748b;
}
.media-video-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.media-video-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.media-video {
  width: 100%;
  max-height: 280px;
  border-radius: 10px;
  background: #0f172a;
}
.media-video-link {
  font-size: 12px;
  color: var(--brand, #1a3a6c);
}
</style>
