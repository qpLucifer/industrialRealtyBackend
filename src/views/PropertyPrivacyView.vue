<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { Delete, Edit } from '@element-plus/icons-vue'
import {
  deletePropertyPrivacyGrant,
  fetchProperties,
  fetchPropertyPrivacyGrants,
  fetchStaffList,
  patchPropertyPrivacyGrant,
  savePropertyPrivacyGrant,
} from '@/api/admin'
import type { PropertyPrivacyGrantRow, PropertyRow, StaffRow } from '@/types/domain'

const list = ref<PropertyPrivacyGrantRow[]>([])
const { listPage, listPageSize, listTotal, resetListPage, applyPagedResult, listQueryParams } =
  useAdminListPagination()
const staffOptions = ref<StaffRow[]>([])
const propertyOptions = ref<PropertyRow[]>([])
const saving = ref(false)

const filterQ = ref('')
const drawerOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  staffIds: [] as string[],
  propertyIds: [] as string[],
  propertyAll: false,
  canViewPrivacy: true,
  canEditProperty: false,
  remark: '',
})

const drawerTitle = computed(() => (editingId.value == null ? '新增隐私授权' : '编辑隐私授权'))

const batchPairCount = computed(() => {
  const staffN = form.staffIds.length
  const propN = form.propertyAll ? propertyOptions.value.length : form.propertyIds.length
  return staffN * propN
})

const propertySelectionHint = computed(() => {
  if (form.propertyAll) return `已全选 ${propertyOptions.value.length} 套房源`
  if (!form.propertyIds.length) return ''
  return `已选 ${form.propertyIds.length} / ${propertyOptions.value.length} 套`
})

async function loadRefs() {
  const [{ list: staff }, { list: props }] = await Promise.all([
    fetchStaffList({ all: true }),
    fetchProperties({ all: true }),
  ])
  staffOptions.value = staff
  propertyOptions.value = props
}

async function load() {
  const result = await fetchPropertyPrivacyGrants({
    q: filterQ.value,
    ...listQueryParams(),
  })
  list.value = result.list
  applyPagedResult(result)
}

function onFilterChange() {
  resetListPage()
  void load()
}

function resetForm() {
  form.staffIds = []
  form.propertyIds = []
  form.propertyAll = false
  form.canViewPrivacy = false
  form.canEditProperty = false
  form.remark = ''
}

function openNew() {
  editingId.value = null
  resetForm()
  drawerOpen.value = true
}

function openEdit(row: PropertyPrivacyGrantRow) {
  editingId.value = row.id
  form.staffIds = [row.staffId]
  form.propertyIds = [row.propertyId]
  form.propertyAll = false
  form.canViewPrivacy = row.canViewPrivacy
  form.canEditProperty = row.canEditProperty
  form.remark = row.remark || ''
  drawerOpen.value = true
}

function selectAllStaff() {
  if (!staffOptions.value.length) {
    ElMessage.warning('暂无员工可选')
    return
  }
  form.staffIds = staffOptions.value.map((s) => s.id)
}

function clearStaff() {
  form.staffIds = []
}

function selectAllProperties() {
  if (!propertyOptions.value.length) {
    ElMessage.warning('暂无房源可选')
    return
  }
  form.propertyAll = true
  form.propertyIds = []
}

function clearProperties() {
  form.propertyAll = false
  form.propertyIds = []
}

function onPropertyIdsChange() {
  if (form.propertyIds.length > 0) form.propertyAll = false
}

async function onSave() {
  if (editingId.value == null) {
    if (!form.staffIds.length) {
      ElMessage.warning('请选择员工')
      return
    }
    if (!form.propertyAll && !form.propertyIds.length) {
      ElMessage.warning('请选择房源或点击全选')
      return
    }
    const pairs = batchPairCount.value
    if (pairs > 50) {
      try {
        await ElMessageBox.confirm(
          `将为 ${form.staffIds.length} 名员工 × ${form.propertyAll ? propertyOptions.value.length : form.propertyIds.length} 套房源写入授权（共 ${pairs} 条），是否继续？`,
          '批量授权确认',
          { type: 'warning' },
        )
      } catch {
        return
      }
    }
    saving.value = true
    try {
      const result = await savePropertyPrivacyGrant({
        staffIds: form.staffIds,
        propertyIds: form.propertyAll ? undefined : form.propertyIds,
        propertyAll: form.propertyAll,
        canViewPrivacy: form.canViewPrivacy,
        canEditProperty: form.canEditProperty,
        remark: form.remark.trim(),
      })
      if ('total' in result) {
        ElMessage.success(`已处理 ${result.total} 条（新增 ${result.created} · 更新 ${result.updated}）`)
      } else {
        ElMessage.success('已保存授权')
      }
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '保存失败')
      return
    } finally {
      saving.value = false
    }
  } else {
    saving.value = true
    try {
      await patchPropertyPrivacyGrant(editingId.value, {
        canViewPrivacy: form.canViewPrivacy,
        canEditProperty: form.canEditProperty,
        remark: form.remark.trim(),
      })
      ElMessage.success('已更新')
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '更新失败')
      return
    } finally {
      saving.value = false
    }
  }
  drawerOpen.value = false
  await load()
}

async function onTogglePrivacy(row: PropertyPrivacyGrantRow) {
  try {
    await patchPropertyPrivacyGrant(row.id, { canViewPrivacy: !row.canViewPrivacy })
    row.canViewPrivacy = !row.canViewPrivacy
    ElMessage.success(row.canViewPrivacy ? '已允许查看隐私' : '已禁止查看隐私')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function onToggleEdit(row: PropertyPrivacyGrantRow) {
  try {
    await patchPropertyPrivacyGrant(row.id, { canEditProperty: !row.canEditProperty })
    row.canEditProperty = !row.canEditProperty
    ElMessage.success(row.canEditProperty ? '已允许小程序编辑' : '已禁止小程序编辑')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '操作失败')
  }
}

async function onDelete(row: PropertyPrivacyGrantRow) {
  try {
    await ElMessageBox.confirm(
      `删除「${row.staffName}」对「${row.propertyCode}」的隐私授权？`,
      '确认',
      { type: 'warning' },
    )
  } catch {
    return
  }
  await deletePropertyPrivacyGrant(row.id)
  ElMessage.success('已删除')
  await load()
}

function propertyLabel(p: PropertyRow) {
  return `${p.code} · ${p.title}`
}

function staffLabel(id: string) {
  const s = staffOptions.value.find((r) => r.id === id)
  return s ? `${s.name}（${s.employeeNo}）` : id
}

function propertyLabelById(id: string) {
  const p = propertyOptions.value.find((r) => r.id === id)
  return p ? propertyLabel(p) : id
}

onMounted(async () => {
  await loadRefs()
  await load()
})
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <input
        v-model="filterQ"
        type="search"
        placeholder="员工 / 工号 / 房源编号"
        style="min-width: 200px"
        @keyup.enter="load"
      />
      <button type="button" class="btn btn-primary" @click="onFilterChange">查询</button>
      <button type="button" class="btn btn-primary" @click="openNew">＋ 新增授权</button>
    </div>

    <div class="card">
      <h3 style="margin: 0 0 8px">房源隐私与编辑授权</h3>
      <p class="hint" style="margin: 0 0 12px">
        控制员工在小程序对某套房源的权限：<strong>查看隐私</strong>（公司名称、业主联系人）与
        <strong>编辑房源</strong>（已上架后可全量编辑并立即生效）。
        <strong>未新增授权记录时默认不可见、不可编辑</strong>；需在下方分别配置（含房源提交人）。
        新增时可<strong>多选员工与房源</strong>，批量生成授权记录。
      </p>
      <table class="data">
        <thead>
          <tr>
            <th>员工</th>
            <th>房源</th>
            <th>可查看隐私</th>
            <th>可编辑房源</th>
            <th>备注</th>
            <th>更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.staffName }}<span class="hint">（{{ r.employeeNo }}）</span></td>
            <td>{{ r.propertyCode }} · {{ r.propertyTitle }}</td>
            <td>
              <button type="button" class="tag" :class="r.canViewPrivacy ? 'mint' : 'rose'" @click="onTogglePrivacy(r)">
                {{ r.canViewPrivacy ? '允许' : '禁止' }}
              </button>
            </td>
            <td>
              <button type="button" class="tag" :class="r.canEditProperty ? 'mint' : 'rose'" @click="onToggleEdit(r)">
                {{ r.canEditProperty ? '允许' : '禁止' }}
              </button>
            </td>
            <td>{{ r.remark || '—' }}</td>
            <td class="hint">{{ r.updatedAt || '—' }}</td>
            <td class="table-actions">
              <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(r)" />
              <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(r)" />
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="7" class="hint" style="text-align: center; padding: 24px">暂无授权记录</td>
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

    <el-drawer v-model="drawerOpen" :title="drawerTitle" direction="rtl" size="min(480px, 100%)">
      <div class="form-grid">
        <div class="full">
          <label>员工<span class="req">*</span></label>
          <template v-if="editingId != null">
            <input type="text" readonly :value="staffLabel(form.staffIds[0] || '')" style="margin-top: 4px" />
          </template>
          <template v-else>
            <div class="select-toolbar">
              <button type="button" class="btn" @click="selectAllStaff">全选</button>
              <button type="button" class="btn" @click="clearStaff">清空</button>
              <span v-if="form.staffIds.length" class="hint">已选 {{ form.staffIds.length }} 人</span>
            </div>
            <el-select
              v-model="form.staffIds"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              placeholder="选择员工（可多选）"
              style="width: 100%; margin-top: 8px"
            >
              <el-option
                v-for="s in staffOptions"
                :key="s.id"
                :label="`${s.name}（${s.employeeNo}）`"
                :value="s.id"
              />
            </el-select>
          </template>
        </div>
        <div class="full">
          <label>房源<span class="req">*</span></label>
          <template v-if="editingId != null">
            <input type="text" readonly :value="propertyLabelById(form.propertyIds[0] || '')" style="margin-top: 4px" />
          </template>
          <template v-else>
            <div class="select-toolbar">
              <button type="button" class="btn" @click="selectAllProperties">全选</button>
              <button type="button" class="btn" @click="clearProperties">清空</button>
              <span v-if="propertySelectionHint" class="hint">{{ propertySelectionHint }}</span>
            </div>
            <el-select
              v-model="form.propertyIds"
              multiple
              filterable
              clearable
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="3"
              :disabled="form.propertyAll"
              placeholder="选择房源（可多选），或使用全选"
              style="width: 100%; margin-top: 8px"
              @change="onPropertyIdsChange"
            >
              <el-option
                v-for="p in propertyOptions"
                :key="p.id"
                :label="propertyLabel(p)"
                :value="p.id"
              />
            </el-select>
            <p v-if="form.propertyAll" class="hint property-all-hint">
              已勾选全部 {{ propertyOptions.length }} 套房源（按当前列表全选）
            </p>
          </template>
        </div>
        <div class="full">
          <label>可查看房源隐私</label>
          <select v-model="form.canViewPrivacy" style="width: 100%; margin-top: 4px">
            <option :value="true">允许</option>
            <option :value="false">禁止</option>
          </select>
        </div>
        <div class="full">
          <label>可编辑房源（已上架）</label>
          <select v-model="form.canEditProperty" style="width: 100%; margin-top: 4px">
            <option :value="true">允许</option>
            <option :value="false">禁止</option>
          </select>
          <p class="hint" style="margin: 6px 0 0">草稿/驳回仍按区域或提交人规则编辑；此项仅控制已上架房源。</p>
        </div>
        <div class="full">
          <label>备注</label>
          <input v-model="form.remark" type="text" maxlength="255" placeholder="可选" />
        </div>
        <div v-if="editingId == null && batchPairCount > 0" class="full">
          <p class="hint batch-hint">将写入约 {{ batchPairCount }} 条授权（员工 × 房源，已存在则更新）</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 18px">
        <button type="button" class="btn btn-primary" :disabled="saving" @click="onSave">
          {{ saving ? '保存中…' : '保存' }}
        </button>
        <button type="button" class="btn" @click="drawerOpen = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.req {
  color: var(--rose, #e11d48);
}
.select-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
}
.property-all-hint {
  margin: 8px 0 0;
  color: var(--mint, #059669);
}
.batch-hint {
  margin: 0;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
}
</style>
