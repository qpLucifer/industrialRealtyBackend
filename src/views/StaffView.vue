<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteStaffApi, fetchCodeMasterItems, fetchRegionDefs, fetchStaffForm, fetchStaffList, patchStaffStatusApi, postStaffImportCsv, saveStaffForm } from '@/api/admin'
import type { CodeMasterRow, RegionDefRow, StaffForm, StaffRow } from '@/types/domain'
import { csvEscape } from '@/lib/csv'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { Delete, Edit, Lock } from '@element-plus/icons-vue'
import {
  emailFormatErrorMessage,
  handleCnMobilePaste,
  normalizeCnMobileInput,
  onCnMobileCompositionEnd,
  preventNonDigitPhoneBeforeInput,
  preventNonDigitPhoneKeys,
} from '@/lib/inputValidators'

const list = ref<StaffRow[]>([])
const { listPage, listPageSize, listTotal, resetListPage, applyPagedResult, listQueryParams } =
  useAdminListPagination()
const regionDefs = ref<RegionDefRow[]>([])
const accountStatusMaster = ref<CodeMasterRow[]>([])
const departmentMaster = ref<CodeMasterRow[]>([])
const jobTitleMaster = ref<CodeMasterRow[]>([])

const FALLBACK_ACCOUNT_STATUS = ['正常', '禁用（离职）', '冻结（风控）']
const FALLBACK_DEPARTMENTS = ['总经办', '黄埔业务一部', '南沙业务二部', '运营中心', '人事行政']
const FALLBACK_JOB_TITLES = ['部门总监', '业务经理', '高级业务员', '业务员', '人事专员']

function masterLabels(rows: CodeMasterRow[], fallback: string[]) {
  return rows.length ? rows.map((r) => r.label) : [...fallback]
}

function labelsWithOrphan(rows: CodeMasterRow[], fallback: string[], current: string) {
  const base = masterLabels(rows, fallback)
  const c = String(current || '').trim()
  if (c && !base.includes(c)) return [c, ...base]
  return base
}

async function loadCodeMaster() {
  try {
    const [b, c, d] = await Promise.all([
      fetchCodeMasterItems('staff_account_status', { pageSize: 100 }),
      fetchCodeMasterItems('staff_department', { pageSize: 100 }),
      fetchCodeMasterItems('staff_job_title', { pageSize: 100 }),
    ])
    accountStatusMaster.value = b.list
    departmentMaster.value = c.list
    jobTitleMaster.value = d.list
  } catch {
    accountStatusMaster.value = []
    departmentMaster.value = []
    jobTitleMaster.value = []
  }
}

const drawer = ref(false)
const form = reactive<StaffForm>({} as StaffForm)
const editingStaffId = ref<string | undefined>(undefined)
const staffQ = ref('')

const accountStatusFormLabels = computed(() =>
  labelsWithOrphan(accountStatusMaster.value, FALLBACK_ACCOUNT_STATUS, form.accountStatus),
)
const departmentFormLabels = computed(() =>
  labelsWithOrphan(departmentMaster.value, FALLBACK_DEPARTMENTS, form.department),
)
const jobTitleFormLabels = computed(() => labelsWithOrphan(jobTitleMaster.value, FALLBACK_JOB_TITLES, form.title))

const staffEmailError = computed(() => emailFormatErrorMessage(String(form.email || '')))

function onStaffEmailBlur() {
  const msg = staffEmailError.value
  if (msg) ElMessage.warning(msg)
}

async function loadRegionDefs() {
  const { list: rows } = await fetchRegionDefs({ all: true })
  regionDefs.value = rows
}

function selectAllRegions() {
  if (!regionDefs.value.length) {
    ElMessage.warning('请先在「区域名称」中维护区域')
    return
  }
  form.regionIds = regionDefs.value.map((d) => d.id)
}

function clearRegions() {
  form.regionIds = []
}

async function loadList() {
  const result = await fetchStaffList({ q: staffQ.value, ...listQueryParams() })
  list.value = result.list
  applyPagedResult(result)
}

function onFilterChange() {
  resetListPage()
  void loadList()
}

async function openDrawerForNew() {
  editingStaffId.value = undefined
  const f = await fetchStaffForm()
  Object.assign(form, f, {
    id: undefined,
    employeeNo: '',
    name: '',
    phone: '',
    regionIds: Array.isArray(f.regionIds) ? [...f.regionIds] : [],
  })
  drawer.value = true
}

async function openEdit(row: StaffRow) {
  editingStaffId.value = row.id
  const f = await fetchStaffForm(row.id)
  Object.assign(form, f)
  form.phone = normalizeCnMobileInput(String(form.phone || ''))
  drawer.value = true
}

onMounted(async () => {
  await Promise.all([loadRegionDefs(), loadCodeMaster()])
  await loadList()
})

watch(
  () => [...(form.regionIds || [])].sort((a, b) => a - b).join(','),
  () => {
    const ids = (form.regionIds || []).filter((id) => id != null)
    const names = ids
      .map((id) => regionDefs.value.find((d) => d.id === id)?.name)
      .filter(Boolean) as string[]
    form.dataScopeHint = names.length ? `授权区域：${names.join('、')}` : '未选择区域'
  },
)

async function onSave() {
  const emp = String(form.employeeNo || '').trim()
  const nm = String(form.name || '').trim()
  const ph = normalizeCnMobileInput(String(form.phone || ''))
  const dept = String(form.department || '').trim()
  if (!emp || emp.length > 32) {
    ElMessage.error('工号必填，最长 32 字符')
    return
  }
  if (!nm || nm.length > 50) {
    ElMessage.error('姓名必填，最长 50 字符')
    return
  }
  if (!/^\d{11}$/.test(ph)) {
    ElMessage.error('请输入 11 位数字手机号')
    return
  }
  const emailErr = emailFormatErrorMessage(String(form.email || ''))
  if (emailErr) {
    ElMessage.error(emailErr)
    return
  }
  if (!dept || dept.length > 64) {
    ElMessage.error('部门必填，最长 64 字符')
    return
  }
  const payload = { ...form, employeeNo: emp, name: nm, phone: ph, department: dept, id: form.id || editingStaffId.value }
  await saveStaffForm(payload)
  ElMessage.success('已保存')
  drawer.value = false
  await loadList()
}

async function onDisable(row: StaffRow) {
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」设为禁用？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  await patchStaffStatusApi(row.id, '禁用')
  ElMessage.success('状态已更新')
  await loadList()
}

async function onDelete(row: StaffRow) {
  try {
    await ElMessageBox.confirm(`确定删除员工「${row.name}」？此操作不可恢复。`, '危险操作', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteStaffApi(row.id)
    ElMessage.success('已删除')
    await loadList()
  } catch {
    /* http interceptor shows API error */
  }
}

function onExportStaffCsv() {
  const header = ['id', 'employeeNo', 'name', 'phoneMasked', 'department', 'title', 'regions', 'status']
  const rows = list.value.map((r) =>
    [r.id, r.employeeNo, r.name, r.phoneMasked, r.department, r.title, r.regions, r.status].map((c) => csvEscape(c)).join(','),
  )
  const csv = [header.join(','), ...rows].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `staff-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('已导出当前列表为 CSV')
}

function onImportCsv() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,text/csv'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    const text = await file.text()
    const out = await postStaffImportCsv(text)
    const errMsg = out.errors?.length ? `；${out.errors.slice(0, 3).join('；')}` : ''
    ElMessage.success(`导入完成：新建 ${out.created}，更新 ${out.updated}${errMsg}`)
    await loadList()
  }
  input.click()
}

function onDownloadStaffTemplate() {
  const header = ['employee_no', 'name', 'phone', 'department', 'title', 'region_ids', 'email', 'hire_date', 'account_status', 'remark']
  const example = ['E001', '张三', '13800138000', '黄埔业务一部', '业务员', '黄埔区,增城区', 'zhang@company.com', '2024-01-01', '正常', '']
  const csv = [header.join(','), example.map((c) => csvEscape(c)).join(',')].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'staff-import-template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('已下载员工导入 CSV 模板')
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openDrawerForNew">＋ 新建员工</button>
      <button type="button" class="btn" @click="onImportCsv">导入 CSV</button>
      <button type="button" class="btn" @click="onExportStaffCsv">导出 CSV</button>
      <button type="button" class="btn" @click="onDownloadStaffTemplate">下载导入模板</button>
      <input
        v-model="staffQ"
        type="search"
        placeholder="搜索：姓名 / 手机 / 工号 / 部门 / 职位"
        style="min-width: 240px"
        @keyup.enter="onFilterChange"
      />
      <button type="button" class="btn btn-primary" @click="onFilterChange">查询</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>工号</th>
            <th>姓名</th>
            <th>手机</th>
            <th>部门</th>
            <th>职位</th>
            <th>负责区域</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in list" :key="s.id">
            <td>{{ s.employeeNo }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.phoneMasked }}</td>
            <td class="cell-wrap">{{ s.department || '—' }}</td>
            <td class="cell-wrap">{{ s.title || '—' }}</td>
            <td>{{ s.regions }}</td>
            <td><span class="tag" :class="s.status === '正常' ? 'mint' : 'rose'">{{ s.status }}</span></td>
            <td>
              <div class="row-actions">
                <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(s)" />
                <TableActionBtn title="禁用" :icon="Lock" variant="warning" @click="onDisable(s)" />
                <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(s)" />
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
      @change="loadList"
    />

    <p class="hint" style="margin-top: 12px">
      一人一号 · 小程序登录须<strong>白名单 + 本表手机号一致</strong>且状态正常；<strong>负责区域</strong>决定小程序房源可见范围；离职「禁用」后无法登录小程序。
    </p>

    <el-drawer v-model="drawer" direction="rtl" size="min(520px, 100%)" :show-close="true" title="">
      <template #header>
        <h3 style="margin: 0; font-size: 17px">员工档案</h3>
      </template>
      <div class="form-grid">
        <div>
          <label>工号<span style="color: var(--rose)">*</span></label>
          <input v-model="form.employeeNo" type="text" maxlength="32" placeholder="最长 32 字符" />
        </div>
        <div>
          <label>姓名<span style="color: var(--rose)">*</span></label>
          <input v-model="form.name" type="text" maxlength="50" />
        </div>
        <div>
          <label>手机号<span style="color: var(--rose)">*</span></label>
          <input
            :value="form.phone"
            type="tel"
            maxlength="11"
            inputmode="numeric"
            lang="en"
            pattern="[0-9]*"
            placeholder="11 位"
            autocomplete="tel"
            @beforeinput="preventNonDigitPhoneBeforeInput"
            @compositionend="onCnMobileCompositionEnd($event as CompositionEvent, (v) => (form.phone = v))"
            @keydown="preventNonDigitPhoneKeys"
            @paste="handleCnMobilePaste($event as ClipboardEvent, () => form.phone, (v) => (form.phone = v))"
            @input="form.phone = normalizeCnMobileInput(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label>邮箱</label>
          <input
            v-model="form.email"
            type="email"
            maxlength="120"
            autocomplete="email"
            class="staff-field"
            :class="{ 'staff-field--invalid': staffEmailError }"
            placeholder="name@company.com"
            @blur="onStaffEmailBlur"
          />
        </div>
        <div>
          <label>部门<span style="color: var(--rose)">*</span></label>
          <select v-model="form.department">
            <option v-for="lab in departmentFormLabels" :key="'dept-' + lab" :value="lab">{{ lab }}</option>
          </select>
        </div>
        <div>
          <label>职位</label>
          <select v-model="form.title">
            <option value="">（未填）</option>
            <option v-for="lab in jobTitleFormLabels" :key="'title-' + lab" :value="lab">{{ lab }}</option>
          </select>
        </div>
        <div>
          <label>入职日期</label>
          <el-date-picker
            v-model="form.hireDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 100%; margin-top: 4px"
            clearable
          />
        </div>
        <div>
          <label>账号状态</label>
          <select v-model="form.accountStatus">
            <option v-for="lab in accountStatusFormLabels" :key="'acct-' + lab" :value="lab">{{ lab }}</option>
          </select>
        </div>
        <div class="full">
          <label>负责区域（与「区域名称」页一致，可多选）</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 6px">
            <button type="button" class="btn" @click="selectAllRegions">全选</button>
            <button type="button" class="btn" @click="clearRegions">清空</button>
          </div>
          <el-select
            v-model="form.regionIds"
            multiple
            filterable
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="下拉选择区域，或使用上方全选"
            style="width: 100%; margin-top: 8px"
          >
            <el-option v-for="d in regionDefs" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </div>
        <div class="full">
          <label>数据可见范围（自动生成）</label>
          <input v-model="form.dataScopeHint" type="text" readonly />
        </div>
        <div class="full">
          <label>备注（人事 / 合规）</label>
          <textarea v-model="form.remark" maxlength="500" rows="3" placeholder="最长 500 字" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 22px">
        <button type="button" class="btn btn-primary" @click="onSave">保存</button>
        <button type="button" class="btn" @click="drawer = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.staff-field--invalid {
  border-color: #f43f5e !important;
  box-shadow: 0 0 0 1px rgba(244, 63, 94, 0.25);
}
.cell-wrap {
  max-width: 140px;
  word-break: break-word;
}
</style>
