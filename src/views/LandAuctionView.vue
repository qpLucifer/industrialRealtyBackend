<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createLandAuctionApi,
  deleteLandAuctionApi,
  fetchLandAuctionStats,
  fetchLandAuctions,
  fetchRegionDefs,
  updateLandAuctionApi,
} from '@/api/admin'
import type { LandAuctionRow, LandAuctionStats, LandAuctionStatus, RegionDefRow } from '@/types/domain'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { assertEndAfterStart } from '@/lib/datetimeRange'
import { datetimeLocalToApi, toDatetimeLocalValue } from '@/lib/beijingTime'
import { Delete, Edit } from '@element-plus/icons-vue'

const STATUS_OPTIONS: { value: '' | LandAuctionStatus; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'upcoming', label: '即将挂拍' },
  { value: 'auctioning', label: '正在拍卖' },
  { value: 'completed', label: '已成交' },
]

const STATUS_CN: Record<LandAuctionStatus, string> = {
  upcoming: '即将挂拍',
  auctioning: '正在拍卖',
  completed: '已成交',
}

const list = ref<LandAuctionRow[]>([])
const stats = ref<LandAuctionStats>({ upcoming: 0, auctioning: 0, completed: 0, total: 0 })
const filterStatus = ref<'' | LandAuctionStatus>('')
const filterQ = ref('')
const filterRegionId = ref<number | ''>('')
const regionDefs = ref<RegionDefRow[]>([])
const { listPage, listPageSize, listTotal, applyPagedResult, listQueryParams } = useAdminListPagination()
const modal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  title: '',
  districtRegionId: 0,
  areaMu: '' as string | number,
  transferTerm: '',
  taxPerMu: '' as string | number,
  investmentPerMu: '' as string | number,
  depositWan: '' as string | number,
  startPriceWan: '' as string | number,
  dealPriceWan: '' as string | number,
  avgPricePerMu: '' as string | number,
  buyerInfo: '',
  auctionStatus: 'upcoming' as LandAuctionStatus,
  listingDate: '',
  auctionStartAt: '',
  auctionEndAt: '',
  completedAt: '',
  remark: '',
  published: true,
  sortOrder: 0,
})

function statusTagClass(s: LandAuctionStatus) {
  if (s === 'auctioning') return 'amber'
  if (s === 'completed') return 'mint'
  return 'slate'
}

function regionFilterParam() {
  return filterRegionId.value === '' ? null : Number(filterRegionId.value)
}

async function loadStats() {
  const r = await fetchLandAuctionStats({ districtRegionId: regionFilterParam() })
  stats.value = r.stats
}

async function load() {
  const result = await fetchLandAuctions({
    ...listQueryParams(),
    status: filterStatus.value || undefined,
    q: filterQ.value.trim() || undefined,
    districtRegionId: regionFilterParam(),
  })
  list.value = result.list
  applyPagedResult(result)
}

async function refresh() {
  await Promise.all([loadStats(), load()])
}

async function loadRegionDefs() {
  try {
    const r = await fetchRegionDefs({ all: true })
    regionDefs.value = r.list ?? []
  } catch {
    regionDefs.value = []
  }
}

function resetForm() {
  form.title = ''
  form.districtRegionId = 0
  form.areaMu = ''
  form.transferTerm = ''
  form.taxPerMu = ''
  form.investmentPerMu = ''
  form.depositWan = ''
  form.startPriceWan = ''
  form.dealPriceWan = ''
  form.avgPricePerMu = ''
  form.buyerInfo = ''
  form.auctionStatus = 'upcoming'
  form.listingDate = ''
  form.auctionStartAt = ''
  form.auctionEndAt = ''
  form.completedAt = ''
  form.remark = ''
  form.published = true
  form.sortOrder = 0
}

function openCreate() {
  editingId.value = null
  resetForm()
  modal.value = true
}

function openEdit(row: LandAuctionRow) {
  editingId.value = row.id
  form.title = row.title
  form.districtRegionId = row.districtRegionId ?? 0
  form.areaMu = row.areaMu ?? ''
  form.transferTerm = row.transferTerm || ''
  form.taxPerMu = row.taxPerMu ?? ''
  form.investmentPerMu = row.investmentPerMu ?? ''
  form.depositWan = row.depositWan ?? ''
  form.startPriceWan = row.startPriceWan ?? ''
  form.dealPriceWan = row.dealPriceWan ?? ''
  form.avgPricePerMu = row.avgPricePerMu ?? ''
  form.buyerInfo = row.buyerInfo || ''
  form.auctionStatus = row.auctionStatus
  form.listingDate = row.listingDate || ''
  form.auctionStartAt = toDatetimeLocalValue(row.auctionStartAt)
  form.auctionEndAt = toDatetimeLocalValue(row.auctionEndAt)
  form.completedAt = toDatetimeLocalValue(row.completedAt)
  form.remark = row.remark
  form.published = row.published
  form.sortOrder = row.sortOrder
  modal.value = true
}

function buildPayload() {
  return {
    title: form.title.trim(),
    districtRegionId: form.districtRegionId > 0 ? form.districtRegionId : null,
    areaMu: form.areaMu === '' ? null : Number(form.areaMu),
    transferTerm: form.transferTerm.trim() || null,
    taxPerMu: form.taxPerMu === '' ? null : Number(form.taxPerMu),
    investmentPerMu: form.investmentPerMu === '' ? null : Number(form.investmentPerMu),
    depositWan: form.depositWan === '' ? null : Number(form.depositWan),
    startPriceWan: form.startPriceWan === '' ? null : Number(form.startPriceWan),
    dealPriceWan: form.dealPriceWan === '' ? null : Number(form.dealPriceWan),
    avgPricePerMu: form.avgPricePerMu === '' ? null : Number(form.avgPricePerMu),
    buyerInfo: form.buyerInfo.trim() || null,
    auctionStatus: form.auctionStatus,
    listingDate: form.listingDate || null,
    auctionStartAt: form.auctionStartAt ? datetimeLocalToApi(form.auctionStartAt) : '',
    auctionEndAt: form.auctionEndAt ? datetimeLocalToApi(form.auctionEndAt) : '',
    completedAt: form.completedAt ? datetimeLocalToApi(form.completedAt) : '',
    remark: form.remark.trim(),
    published: form.published,
    sortOrder: Number(form.sortOrder) || 0,
  }
}

async function onSave() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写地块/项目名称')
    return
  }
  if (!form.districtRegionId || form.districtRegionId <= 0) {
    ElMessage.warning('请选择所属区域')
    return
  }
  if (form.auctionStatus === 'auctioning') {
    const rangeErr = assertEndAfterStart(form.auctionStartAt, form.auctionEndAt)
    if (rangeErr) {
      ElMessage.warning(rangeErr)
      return
    }
  }
  const payload = buildPayload()
  try {
    if (editingId.value == null) {
      await createLandAuctionApi(payload)
      ElMessage.success('已创建')
    } else {
      await updateLandAuctionApi(editingId.value, payload)
      ElMessage.success('已保存')
    }
  } catch {
    return
  }
  modal.value = false
  await refresh()
}

async function onDelete(row: LandAuctionRow) {
  try {
    await ElMessageBox.confirm(`删除「${row.title}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteLandAuctionApi(row.id)
  } catch {
    return
  }
  ElMessage.success('已删除')
  await refresh()
}

onMounted(async () => {
  await loadRegionDefs()
  await refresh()
})

async function onRegionFilterChange() {
  await refresh()
}
</script>

<template>
  <section class="panel active">
    <div class="kpi-grid" style="margin-bottom: 16px">
      <div class="kpi-card">
        <div class="kpi-label">即将挂拍</div>
        <div class="kpi-value">{{ stats.upcoming }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">正在拍卖</div>
        <div class="kpi-value">{{ stats.auctioning }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">已成交</div>
        <div class="kpi-value">{{ stats.completed }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">合计</div>
        <div class="kpi-value">{{ stats.total }}</div>
      </div>
    </div>

    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openCreate">＋ 新建土地条目</button>
      <select v-model="filterStatus" class="toolbar-select" @change="load">
        <option v-for="o in STATUS_OPTIONS" :key="o.label" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="filterRegionId" class="toolbar-select" @change="onRegionFilterChange">
        <option value="">全部区域</option>
        <option v-for="r in regionDefs" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <input
        v-model="filterQ"
        type="search"
        class="toolbar-search"
        placeholder="搜索标题 / 区域 / 备注"
        @keyup.enter="load"
      />
      <button type="button" class="btn" @click="load">筛选</button>
      <button type="button" class="btn" @click="refresh">刷新</button>
    </div>

    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>项目</th>
            <th>区域</th>
            <th>面积(亩)</th>
            <th>起拍/成交(万)</th>
            <th>状态</th>
            <th>时间</th>
            <th>小程序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.title }}</td>
            <td>{{ r.region || '—' }}</td>
            <td>{{ r.areaMu ?? '—' }}</td>
            <td>
              <span v-if="r.auctionStatus === 'completed'">{{ r.dealPriceWan ?? '—' }}</span>
              <span v-else>{{ r.startPriceWan ?? '—' }}</span>
            </td>
            <td>
              <span class="tag" :class="statusTagClass(r.auctionStatus)">{{ STATUS_CN[r.auctionStatus] }}</span>
            </td>
            <td class="cell-wrap hint-sm">
              <template v-if="r.auctionStatus === 'upcoming'">{{ r.listingDate ? `挂拍 ${r.listingDate}` : '—' }}</template>
              <template v-else-if="r.auctionStatus === 'auctioning'">
                {{ r.auctionStartAt || '—' }} ~ {{ r.auctionEndAt || '—' }}
              </template>
              <template v-else>{{ r.completedAt || '—' }}</template>
            </td>
            <td>{{ r.published ? '展示' : '隐藏' }}</td>
            <td>
              <div class="row-actions">
                <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(r)" />
                <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(r)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminListPagination
      v-model:page="listPage"
      v-model:page-size="listPageSize"
      :total="listTotal"
      @change="load"
    />

    <Teleport to="body">
      <div class="modal-center" :class="{ show: modal }" @click.self="modal = false">
        <div class="modal-box" style="max-width: 680px">
          <h3>{{ editingId == null ? '新建工业土地' : '编辑工业土地' }}</h3>
          <div class="form-grid" style="margin-top: 14px">
            <div class="full">
              <label>地块/项目<span style="color: var(--rose)">*</span></label>
              <input v-model="form.title" type="text" placeholder="例如：余杭未来科技城工业用地 A 块" />
            </div>
            <div>
              <label>所属区域<span style="color: var(--rose)">*</span></label>
              <select v-model.number="form.districtRegionId">
                <option :value="0">请选择</option>
                <option v-for="r in regionDefs" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
            <div>
              <label>状态</label>
              <select v-model="form.auctionStatus">
                <option value="upcoming">即将挂拍</option>
                <option value="auctioning">正在拍卖</option>
                <option value="completed">已成交</option>
              </select>
            </div>
            <div>
              <label>面积（亩）</label>
              <input v-model="form.areaMu" type="number" step="0.01" />
            </div>
            <div>
              <label>出让年限</label>
              <input v-model="form.transferTerm" type="text" placeholder="如：50年" />
            </div>
            <div>
              <label>亩产税（万元/亩）</label>
              <input v-model="form.taxPerMu" type="number" step="0.0001" />
            </div>
            <div>
              <label>亩产投资（万元/亩）</label>
              <input v-model="form.investmentPerMu" type="number" step="0.0001" />
            </div>
            <template v-if="form.auctionStatus === 'upcoming' || form.auctionStatus === 'auctioning'">
              <div>
                <label>保证金（万元）</label>
                <input v-model="form.depositWan" type="number" step="0.01" />
              </div>
              <div>
                <label>起始价（万元）</label>
                <input v-model="form.startPriceWan" type="number" step="0.01" />
              </div>
            </template>
            <template v-if="form.auctionStatus === 'completed'">
              <div>
                <label>成交价（万元）</label>
                <input v-model="form.dealPriceWan" type="number" step="0.01" />
              </div>
              <div>
                <label>均价（万元/亩）</label>
                <input v-model="form.avgPricePerMu" type="number" step="0.01" />
              </div>
              <div class="full">
                <label>买方信息</label>
                <input v-model="form.buyerInfo" type="text" placeholder="企业名称、联系人等" />
              </div>
            </template>
            <div v-if="form.auctionStatus === 'upcoming'">
              <label>预计挂拍日期</label>
              <input v-model="form.listingDate" type="date" />
            </div>
            <template v-if="form.auctionStatus === 'auctioning'">
              <div>
                <label>拍卖开始</label>
                <input v-model="form.auctionStartAt" type="datetime-local" />
              </div>
              <div>
                <label>拍卖结束</label>
                <input v-model="form.auctionEndAt" type="datetime-local" />
              </div>
            </template>
            <div v-if="form.auctionStatus === 'completed'" class="full">
              <label>成交时间</label>
              <input v-model="form.completedAt" type="datetime-local" style="max-width: 320px" />
            </div>
            <div class="full">
              <label>备注</label>
              <textarea v-model="form.remark" rows="3" />
            </div>
            <div>
              <label>排序（越大越靠前）</label>
              <input v-model.number="form.sortOrder" type="number" />
            </div>
            <div>
              <label>小程序展示</label>
              <select v-model="form.published">
                <option :value="true">展示</option>
                <option :value="false">隐藏</option>
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 18px; justify-content: flex-end">
            <button type="button" class="btn" @click="modal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onSave">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.cell-wrap {
  max-width: 220px;
  word-break: break-word;
}
.hint-sm {
  font-size: 12px;
  color: #64748b;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.kpi-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}
.kpi-label {
  font-size: 13px;
  color: #64748b;
}
.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-top: 6px;
}
.toolbar-select,
.toolbar-search {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.toolbar-search {
  min-width: 200px;
}
</style>
