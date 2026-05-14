<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchPropertyDetail, fetchRegionDefs, savePropertySnapshot, uploadOssFile } from '@/api/admin'
import MapLatLngPicker from '@/components/MapLatLngPicker.vue'
import type { PropertyFullForm, RegionDefRow } from '@/types/domain'

/** Ensure arrays / flags exist so chips and toggles never throw. */
function ensurePropertyFormShape(f: PropertyFullForm) {
  if (!Array.isArray(f.types) || f.types.length === 0) f.types = ['标准厂房']
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
  if (f.riskTag === undefined || f.riskTag === null) f.riskTag = ''
  if (f.submitterName === undefined || f.submitterName === null) f.submitterName = ''
  // Map picker expects string props; API may omit or send numbers.
  if (f.lat === undefined || f.lat === null) f.lat = ''
  else f.lat = String(f.lat).trim()
  if (f.lng === undefined || f.lng === null) f.lng = ''
  else f.lng = String(f.lng).trim()
}

type RoKey = keyof PropertyFullForm | '_img' | '_vid'

const RO_SECTIONS: { title: string; fields: { key: RoKey; label: string }[] }[] = [
  {
    title: '列表与审核 · 对外状态',
    fields: [
      { key: 'code', label: '编号' },
      { key: 'listTitle', label: '列表标题' },
      { key: 'district', label: '所属区域' },
      { key: 'listingLine1', label: '列表副行 1' },
      { key: 'listingLine2', label: '列表副行 2（含跟进状态文案）' },
      { key: 'auditTag', label: '审核状态' },
      { key: 'riskTag', label: '风险标签（审核队列 / DB risk_tag）' },
      { key: 'submitterName', label: '提交人' },
      { key: 'rowMuted', label: '列表弱化行' },
      { key: 'externalStatus', label: '对外状态' },
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
const uploadingImage = ref(false)
const uploadingVideo = ref(false)
const mediaImageBlock = ref('')
const mediaVideoBlock = ref('')
const regionDefs = ref<RegionDefRow[]>([])

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

const typeOptions = ['标准厂房', '独门独院厂房', '仓库', '工业用地', '写字楼', '产业园商铺'] as const
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
  const lines = String(form.mediaUrls || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  mediaImageBlock.value = lines.filter((l) => !isVideoUrl(l)).join('\n')
  mediaVideoBlock.value = lines.filter((l) => isVideoUrl(l)).join('\n')
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
  form.mediaUrls = [...imgs, ...vids].join('\n')
}

watch(
  () => [props.visible, props.code] as const,
  async ([vis, code]) => {
    if (!vis) return
    const [{ list }, d] = await Promise.all([fetchRegionDefs(), fetchPropertyDetail(code)])
    regionDefs.value = list
    Object.assign(form, d)
    ensurePropertyFormShape(form)
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
  if (String(form.listTitle || '').length > 120) {
    ElMessage.error('列表标题不超过 120 字')
    return
  }
  if (String(form.address || '').length > 200) {
    ElMessage.error('详细地址不超过 200 字')
    return
  }
  if (miss.length) {
    ElMessage.error(`请完善必填项：${miss.join('、')}`)
    return
  }
  await savePropertySnapshot({ ...form, mode: props.mode, code: props.code })
  ElMessage.success('房源已保存')
  emit('saved')
  close()
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
              <p class="hint" style="margin-top: 6px">
                {{
                  mode === 'edit'
                    ? '在此修改字段后保存，将写入 properties。点击空白处不会关闭本窗口。'
                    : '只读查看；关闭请点右上角或底部按钮。'
                }}
              </p>
            </div>
            <button type="button" class="modal-close-icon" aria-label="关闭" @click="close">×</button>
          </div>
          <div v-if="mode === 'edit'" class="admin-modal-tabs">
            <button type="button" :class="{ active: tab === 0 }" @click="setTab(0)">分类 · 基础 · 清单</button>
            <button type="button" :class="{ active: tab === 1 }" @click="setTab(1)">地图定位</button>
            <button type="button" :class="{ active: tab === 2 }" @click="setTab(2)">图片</button>
            <button type="button" :class="{ active: tab === 3 }" @click="setTab(3)">视频</button>
            <button type="button" :class="{ active: tab === 4 }" @click="setTab(4)">土地 · 配套 · 使用</button>
            <button type="button" :class="{ active: tab === 5 }" @click="setTab(5)">产权 · 合规 · 跟进</button>
          </div>
        </div>
        <div class="modal-prop-scroll">
          <template v-if="mode === 'edit'">
          <div class="prop-admin-panel" :class="{ active: tab === 0 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">列表与审核（与表格列一致）</div>
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
              <div>
                <label>审核状态（列表）</label>
                <select v-model="form.auditTag" style="margin-top: 5px">
                  <option value="已通过">已通过</option>
                  <option value="待审核">待审核</option>
                  <option value="—">—</option>
                </select>
              </div>
              <div class="full">
                <label>风险标签（审核中心展示，保存至数据库 risk_tag）</label>
                <input v-model="form.riskTag" type="text" maxlength="64" placeholder="如：资料待核、无、首次发布" />
              </div>
              <div class="form-section-h" style="margin-top: 8px">分类 · 基础 · 清单</div>
              <div class="full">
                <label>房源类型（多选）<span style="color: var(--rose)">*</span></label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="t in typeOptions"
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
                <input v-model="form.lat" type="text" maxlength="20" placeholder="例：23.179455" />
              </div>
              <div>
                <label>经度（GCJ-02）<span style="color: var(--rose)">*</span></label>
                <input v-model="form.lng" type="text" maxlength="20" placeholder="例：113.429512" />
              </div>
              <div class="full">
                <MapLatLngPicker v-model:lat="form.lat" v-model:lng="form.lng" :disabled="false" />
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
                <label>上传图片到 OSS</label>
                <input type="file" accept="image/*" multiple :disabled="uploadingImage" @change="onPickImages" />
                <p class="hint">追加到上方列表；需后端配置 OSS_*。</p>
              </div>
              <div v-if="imagePreviewUrls.length" class="full media-preview-block">
                <label>预览（点击放大）</label>
                <p class="hint" style="margin: 0 0 8px">
                  使用无 Referer 请求以降低 OSS 防盗链 403；若仍失败请在 Bucket 中放行本后台域名或关闭 Referer 白名单。
                </p>
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
                <label>上传视频到 OSS</label>
                <input type="file" accept="video/*" multiple :disabled="uploadingVideo" @change="onPickVideos" />
                <p class="hint">追加到上方列表。</p>
              </div>
              <div v-if="videoPreviewUrls.length" class="full media-preview-block">
                <label>预览</label>
                <p class="hint" style="margin: 0 0 8px">与图片相同：已加无 Referer 策略；若 403 请检查 OSS 读权限与防盗链。</p>
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
                <input v-model.number="form.landMu" type="number" step="0.01" />
              </div>
              <div>
                <label>实际土地（亩）</label>
                <input v-model.number="form.actualLandMu" type="number" step="0.01" />
              </div>
              <div>
                <label>建筑面积（㎡）</label>
                <input v-model.number="form.buildingArea" type="number" />
              </div>
              <div>
                <label>实际使用面积（㎡）</label>
                <input v-model.number="form.actualUseArea" type="number" />
              </div>
              <div>
                <label>总层数（层）</label>
                <input v-model.number="form.floors" type="number" />
              </div>
              <div>
                <label>承重能力（吨/m²）</label>
                <input v-model.number="form.loadPerSqm" type="number" step="0.1" />
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
                <input v-model="form.structureOther" type="text" placeholder="选其他时填写" />
              </div>

              <div class="form-section-h">3. 电力与货运设施</div>
              <div>
                <label>电力总容量（kVA）<span style="color: var(--rose)">*</span></label>
                <input v-model.number="form.powerKva" type="number" />
              </div>
              <div>
                <label>现有变压器（台）</label>
                <input v-model.number="form.transformers" type="number" />
              </div>
              <div>
                <label>货梯（台）</label>
                <input v-model.number="form.freightLifts" type="number" />
              </div>
              <div>
                <label>货梯载重（吨）</label>
                <input v-model.number="form.liftLoadT" type="number" step="0.1" />
              </div>
              <div class="full">
                <label>货梯长宽高（米）</label>
                <input v-model="form.liftDims" type="text" />
              </div>
              <div>
                <label>装卸平台高度（cm）</label>
                <input v-model.number="form.platformHeightCm" type="number" />
              </div>
              <div>
                <label>货车转弯半径（米）</label>
                <input v-model.number="form.turnRadiusM" type="number" step="0.1" />
              </div>

              <div class="form-section-h">4. 周边配套<span style="color: var(--rose)">*</span></div>
              <div>
                <label>宿舍 · 园区内租金（元/房）</label>
                <input v-model.number="form.dormRent" type="number" placeholder="可选" />
              </div>
              <div>
                <label>宿舍 · 周边距离（公里）</label>
                <input v-model.number="form.dormDistanceKm" type="number" step="0.1" placeholder="可选" />
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
                <input v-model.number="form.stationDistanceM" type="number" />
              </div>

              <div class="form-section-h">5. 使用情况<span style="color: var(--rose)">*</span></div>
              <div>
                <label>自用（㎡）</label>
                <input v-model.number="form.selfUseSqm" type="number" />
              </div>
              <div>
                <label>租金估算（元/年）</label>
                <input v-model.number="form.rentEstimateYear" type="number" />
              </div>
              <div>
                <label>共租（家）</label>
                <input v-model.number="form.coTenantCount" type="number" />
              </div>
              <div>
                <label>年租金（元/年）</label>
                <input v-model.number="form.annualRent" type="number" placeholder="共租时" />
              </div>
              <div class="full">
                <label>租客公司名称</label>
                <input v-model="form.tenantCompanies" type="text" placeholder="多家顿号分隔" />
              </div>
              <div>
                <label>合同还有（年）</label>
                <input v-model.number="form.contractYearsLeft" type="number" step="0.1" />
              </div>
              <div>
                <label>厂房全部腾空（月）</label>
                <input v-model.number="form.vacantMonths" type="number" />
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
                <input v-model="form.propertyRightsOther" type="text" />
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
                <input v-model="form.landUseOther" type="text" />
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
                <textarea v-model="form.mortgageNote" rows="2" />
              </div>

              <div class="form-section-h">8. 交易条款<span style="color: var(--rose)">*</span> · 税费</div>
              <div>
                <label>房东心里价位（万）</label>
                <input v-model.number="form.landlordPriceWan" type="number" step="0.01" />
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
                <input v-model="form.fireOther" type="text" />
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
                <input v-model="form.fireFailReason" type="text" />
              </div>

              <div class="form-section-h">11. 物流便捷度</div>
              <div>
                <label>最近高速口（km）</label>
                <input v-model.number="form.highwayKm" type="number" step="0.1" />
              </div>
              <div>
                <label>港口/机场（km）</label>
                <input v-model.number="form.portAirportKm" type="number" step="0.1" />
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
                <input v-model="form.subsidyDetail" type="text" />
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

              <div class="form-section-h">内部跟进（小程序同源）</div>
              <div>
                <label>对外状态（列表「状态」列）</label>
                <select v-model="form.externalStatus">
                  <option>草稿</option>
                  <option>待租</option>
                  <option>已租</option>
                  <option>待售</option>
                  <option>已售</option>
                  <option>意向中</option>
                  <option>下架封存</option>
                </select>
              </div>
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
                <input v-model.number="form.rentListSqm" type="number" />
              </div>
              <div>
                <label>物业费（元/㎡·月）</label>
                <input v-model.number="form.propertyFee" type="number" step="0.1" />
              </div>
              <div>
                <label>联系人姓名<span style="color: var(--rose)">*</span></label>
                <input v-model="form.contactName" type="text" />
              </div>
              <div>
                <label>联系人电话<span style="color: var(--rose)">*</span></label>
                <input v-model="form.contactPhone" type="text" />
              </div>
              <div class="full">
                <label>看房预约备注</label>
                <textarea v-model="form.viewingNote" rows="2" />
              </div>
              <div class="full">
                <label>内部备注（不对客户）</label>
                <textarea v-model="form.internalNote" rows="2" />
              </div>
            </div>
          </div>
          </template>
          <div v-else class="prop-readonly-summary">
            <p class="hint" style="margin: 0 0 14px">
              以下为与编辑表单一致的完整字段；媒体 URL 与编辑区「图片 / 视频」分行一致。
            </p>
            <section v-for="sec in RO_SECTIONS" :key="sec.title" class="ro-sec">
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
        <div class="modal-prop-foot">
          <button type="button" class="btn" @click="close">关闭</button>
          <button v-if="mode === 'edit'" type="button" class="btn btn-primary" @click="onSave">保存修改</button>
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
  color: var(--mint, #0d9488);
}
</style>
