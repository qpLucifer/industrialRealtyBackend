<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit } from '@element-plus/icons-vue'
import {
  createDealApi,
  createViewingApi,
  deleteDealApi,
  deleteViewingApi,
  fetchCustomers,
  fetchStaffList,
  fetchViewingsSummary,
  updateDealApi,
  updateViewingApi,
} from '@/api/admin'
import type { CustomerRow, DealRow, StaffRow, ViewingRow } from '@/types/domain'

const viewings = ref<ViewingRow[]>([])
const deals = ref<DealRow[]>([])
const customerOptions = ref<CustomerRow[]>([])
const staffOptions = ref<StaffRow[]>([])

const vModal = ref(false)
const vEditingId = ref<number | null>(null)
const vForm = reactive({
  start: '',
  end: '',
  propertyRef: '',
  customerSlug: '' as string,
  companionStaffIds: [] as string[],
  score: 'B',
})

const dModal = ref(false)
const dEditingId = ref<number | null>(null)
const dForm = reactive({
  contractType: '租赁合同',
  amount: '¥0',
  commission: '¥0',
  invoiceType: '专票',
  archiveStatus: '待归档',
})

const ARCHIVE_OPTIONS = ['待归档', '已归档', '处理中', '已驳回'] as const

async function loadRefs() {
  const [{ list: cust }, { list: staff }] = await Promise.all([fetchCustomers({}), fetchStaffList({})])
  customerOptions.value = cust
  staffOptions.value = staff
}

async function load() {
  const d = await fetchViewingsSummary()
  viewings.value = d.viewings
  deals.value = d.deals
}

function companionLabel(ids: string[]) {
  return ids
    .map((id) => staffOptions.value.find((s) => s.id === id)?.name)
    .filter(Boolean)
    .join('、')
}

function parseCompanionIds(names: string) {
  if (!names.trim()) return []
  const parts = names.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
  const ids: string[] = []
  for (const p of parts) {
    const s = staffOptions.value.find((x) => x.name === p)
    if (s) ids.push(s.id)
  }
  return ids
}

function openNewViewing() {
  vEditingId.value = null
  vForm.start = ''
  vForm.end = ''
  vForm.propertyRef = ''
  vForm.customerSlug = ''
  vForm.companionStaffIds = []
  vForm.score = 'B'
  vModal.value = true
}

function openEditViewing(row: ViewingRow) {
  if (row.id == null) return
  vEditingId.value = row.id
  vForm.start = row.start
  vForm.end = row.end
  vForm.propertyRef = row.propertyRef
  vForm.customerSlug = row.customerSlug || ''
  vForm.companionStaffIds = parseCompanionIds(row.companions || '')
  vForm.score = row.score
  vModal.value = true
}

async function saveViewing() {
  if (!vForm.start || !vForm.end) {
    ElMessage.warning('请选择带看开始与结束时间')
    return
  }
  if (!String(vForm.propertyRef || '').trim()) {
    ElMessage.warning('请填写房源编号')
    return
  }
  if (!vForm.customerSlug) {
    ElMessage.warning('请从客户统筹中选择客户')
    return
  }
  const cust = customerOptions.value.find((c) => (c.slug || c.id) === vForm.customerSlug)
  const customerName = cust ? cust.titleLine || [cust.contactName, cust.company].filter(Boolean).join(' · ') || cust.name : ''
  const companions = companionLabel(vForm.companionStaffIds)
  const payload = {
    start: vForm.start,
    end: vForm.end,
    propertyRef: vForm.propertyRef,
    customerSlug: vForm.customerSlug,
    customerName,
    companions,
    score: vForm.score,
  }
  if (vEditingId.value != null) {
    await updateViewingApi(vEditingId.value, payload)
    ElMessage.success('带看已更新')
  } else {
    await createViewingApi(payload)
    ElMessage.success('带看已新增')
  }
  vModal.value = false
  await load()
}

async function removeViewing(row: ViewingRow) {
  if (row.id == null) return
  try {
    await ElMessageBox.confirm('删除该带看记录？', '确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteViewingApi(row.id)
  ElMessage.success('已删除')
  await load()
}

function openNewDeal() {
  dEditingId.value = null
  dForm.contractType = '租赁合同'
  dForm.amount = '¥0'
  dForm.commission = '¥0'
  dForm.invoiceType = '专票'
  dForm.archiveStatus = '待归档'
  dModal.value = true
}

function openEditDeal(row: DealRow) {
  if (row.id == null) return
  dEditingId.value = row.id
  dForm.contractType = row.contractType
  dForm.amount = row.amount
  dForm.commission = row.commission
  dForm.invoiceType = row.invoiceType
  dForm.archiveStatus = row.archiveStatus
  dModal.value = true
}

async function saveDeal() {
  const payload = { ...dForm }
  if (dEditingId.value != null) {
    await updateDealApi(dEditingId.value, payload)
    ElMessage.success('成交已更新')
  } else {
    await createDealApi(payload)
    ElMessage.success('成交已新增')
  }
  dModal.value = false
  await load()
}

async function removeDeal(row: DealRow) {
  if (row.id == null) return
  try {
    await ElMessageBox.confirm('删除该成交备案？', '确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteDealApi(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(async () => {
  await loadRefs()
  await load()
})
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn" @click="loadRefs().then(() => load())">刷新</button>
    </div>
    <div class="grid-2">
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px">
          <h3 style="margin: 0">带看台账</h3>
          <button type="button" class="btn btn-primary" @click="openNewViewing">＋ 新增带看</button>
        </div>
        <table class="data" style="margin-top: 8px">
          <thead>
            <tr>
              <th>ID</th>
              <th>开始</th>
              <th>结束</th>
              <th>房源</th>
              <th>客户</th>
              <th>陪同员工</th>
              <th>评分</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in viewings" :key="r.id ?? r.start + r.propertyRef">
              <td>{{ r.id ?? '—' }}</td>
              <td>{{ r.start }}</td>
              <td>{{ r.end }}</td>
              <td>{{ r.propertyRef }}</td>
              <td>{{ r.customerName }}</td>
              <td>{{ r.companions }}</td>
              <td>{{ r.score }}</td>
              <td class="table-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    circle
                    plain
                    size="small"
                    :disabled="r.id == null"
                    @click="openEditViewing(r)"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    plain
                    size="small"
                    :disabled="r.id == null"
                    @click="removeViewing(r)"
                  />
                </el-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px">
          <h3 style="margin: 0">成交备案</h3>
          <button type="button" class="btn btn-primary" @click="openNewDeal">＋ 新增成交</button>
        </div>
        <table class="data" style="margin-top: 8px">
          <thead>
            <tr>
              <th>ID</th>
              <th>合同类型</th>
              <th>成交额</th>
              <th>佣金</th>
              <th>开票</th>
              <th>归档</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in deals" :key="r.id ?? r.amount">
              <td>{{ r.id ?? '—' }}</td>
              <td>{{ r.contractType }}</td>
              <td>{{ r.amount }}</td>
              <td>{{ r.commission }}</td>
              <td>{{ r.invoiceType }}</td>
              <td><span class="tag mint">{{ r.archiveStatus }}</span></td>
              <td class="table-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button
                    type="primary"
                    :icon="Edit"
                    circle
                    plain
                    size="small"
                    :disabled="r.id == null"
                    @click="openEditDeal(r)"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    plain
                    size="small"
                    :disabled="r.id == null"
                    @click="removeDeal(r)"
                  />
                </el-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div class="modal-center" :class="{ show: vModal }" @click.self="vModal = false">
        <div class="modal-box" style="max-width: 520px">
          <h3>{{ vEditingId == null ? '新增带看' : '编辑带看' }}</h3>
          <div class="form-grid" style="margin-top: 12px">
            <div class="full">
              <label>开始时间<span style="color: var(--rose)">*</span></label>
              <el-date-picker
                v-model="vForm.start"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择开始"
                style="width: 100%; margin-top: 4px"
              />
            </div>
            <div class="full">
              <label>结束时间<span style="color: var(--rose)">*</span></label>
              <el-date-picker
                v-model="vForm.end"
                type="datetime"
                value-format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择结束"
                style="width: 100%; margin-top: 4px"
              />
            </div>
            <div class="full">
              <label>房源编号<span style="color: var(--rose)">*</span></label>
              <input v-model="vForm.propertyRef" type="text" maxlength="32" placeholder="P-8821" />
            </div>
            <div class="full">
              <label>客户<span style="color: var(--rose)">*</span></label>
              <el-select
                v-model="vForm.customerSlug"
                filterable
                placeholder="从客户统筹选择（单选）"
                style="width: 100%; margin-top: 4px"
              >
                <el-option
                  v-for="c in customerOptions"
                  :key="c.slug || c.id"
                  :label="c.titleLine || [c.contactName, c.company].filter(Boolean).join(' · ') || c.name"
                  :value="c.slug || c.id"
                />
              </el-select>
            </div>
            <div class="full">
              <label>陪同员工（多选）</label>
              <el-select
                v-model="vForm.companionStaffIds"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="从员工列表选择"
                style="width: 100%; margin-top: 4px"
              >
                <el-option
                  v-for="s in staffOptions"
                  :key="s.id"
                  :label="`${s.name}（${s.employeeNo}）`"
                  :value="s.id"
                />
              </el-select>
            </div>
            <div>
              <label>评分</label>
              <input v-model="vForm.score" type="text" maxlength="8" />
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end">
            <button type="button" class="btn" @click="vModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="saveViewing">保存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div class="modal-center" :class="{ show: dModal }" @click.self="dModal = false">
        <div class="modal-box" style="max-width: 480px">
          <h3>{{ dEditingId == null ? '新增成交' : '编辑成交' }}</h3>
          <div class="form-grid" style="margin-top: 12px">
            <div class="full"><label>合同类型</label><input v-model="dForm.contractType" type="text" maxlength="40" /></div>
            <div><label>成交额</label><input v-model="dForm.amount" type="text" maxlength="40" /></div>
            <div><label>佣金</label><input v-model="dForm.commission" type="text" maxlength="40" /></div>
            <div><label>开票类型</label><input v-model="dForm.invoiceType" type="text" maxlength="20" /></div>
            <div class="full">
              <label>归档状态</label>
              <select v-model="dForm.archiveStatus" style="width: 100%; margin-top: 4px">
                <option v-for="a in ARCHIVE_OPTIONS" :key="a" :value="a">{{ a }}</option>
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end">
            <button type="button" class="btn" @click="dModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="saveDeal">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}
</style>
