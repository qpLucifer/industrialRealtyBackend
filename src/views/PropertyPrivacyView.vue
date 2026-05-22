<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TableActionBtn from '@/components/TableActionBtn.vue'
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
const staffOptions = ref<StaffRow[]>([])
const propertyOptions = ref<PropertyRow[]>([])

const filterQ = ref('')
const drawerOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  staffId: '',
  propertyId: '',
  canViewPrivacy: true,
  remark: '',
})

const drawerTitle = computed(() => (editingId.value == null ? '新增隐私授权' : '编辑隐私授权'))

async function loadRefs() {
  const [{ list: staff }, { list: props }] = await Promise.all([
    fetchStaffList({}),
    fetchProperties({}),
  ])
  staffOptions.value = staff
  propertyOptions.value = props
}

async function load() {
  const { list: rows } = await fetchPropertyPrivacyGrants({
    q: filterQ.value,
  })
  list.value = rows
}

function openNew() {
  editingId.value = null
  form.staffId = ''
  form.propertyId = ''
  form.canViewPrivacy = false
  form.remark = ''
  drawerOpen.value = true
}

function openEdit(row: PropertyPrivacyGrantRow) {
  editingId.value = row.id
  form.staffId = row.staffId
  form.propertyId = row.propertyId
  form.canViewPrivacy = row.canViewPrivacy
  form.remark = row.remark || ''
  drawerOpen.value = true
}

async function onSave() {
  if (!form.staffId) {
    ElMessage.warning('请选择员工')
    return
  }
  if (!form.propertyId) {
    ElMessage.warning('请选择房源')
    return
  }
  if (editingId.value == null) {
    await savePropertyPrivacyGrant({
      staffId: form.staffId,
      propertyId: form.propertyId,
      canViewPrivacy: form.canViewPrivacy,
      remark: form.remark.trim(),
    })
    ElMessage.success('已保存授权')
  } else {
    await patchPropertyPrivacyGrant(editingId.value, {
      canViewPrivacy: form.canViewPrivacy,
      remark: form.remark.trim(),
    })
    ElMessage.success('已更新')
  }
  drawerOpen.value = false
  await load()
}

async function onToggle(row: PropertyPrivacyGrantRow) {
  try {
    await patchPropertyPrivacyGrant(row.id, { canViewPrivacy: !row.canViewPrivacy })
    row.canViewPrivacy = !row.canViewPrivacy
    ElMessage.success(row.canViewPrivacy ? '已允许查看隐私' : '已禁止查看隐私')
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
      <button type="button" class="btn btn-primary" @click="load">查询</button>
      <button type="button" class="btn btn-primary" @click="openNew">＋ 新增授权</button>
    </div>

    <div class="card">
      <h3 style="margin: 0 0 8px">房源隐私授权</h3>
      <p class="hint" style="margin: 0 0 12px">
        控制员工在小程序查看某套房源时，是否可见<strong>公司名称、业主联系人</strong>。
        <strong>未新增授权记录时默认不可见</strong>；新增时默认为「禁止」，需改为「允许」后方可查看（含房源提交人，也须在后台单独授权）。
      </p>
      <table class="data">
        <thead>
          <tr>
            <th>员工</th>
            <th>房源</th>
            <th>可查看隐私</th>
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
              <button type="button" class="tag" :class="r.canViewPrivacy ? 'mint' : 'rose'" @click="onToggle(r)">
                {{ r.canViewPrivacy ? '允许' : '禁止' }}
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
            <td colspan="6" class="hint" style="text-align: center; padding: 24px">暂无授权记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-drawer v-model="drawerOpen" :title="drawerTitle" direction="rtl" size="min(420px, 100%)">
      <div class="form-grid">
        <div class="full">
          <label>员工<span class="req">*</span></label>
          <el-select
            v-model="form.staffId"
            filterable
            :disabled="editingId != null"
            placeholder="选择员工"
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
        <div class="full">
          <label>房源<span class="req">*</span></label>
          <el-select
            v-model="form.propertyId"
            filterable
            :disabled="editingId != null"
            placeholder="选择房源"
            style="width: 100%; margin-top: 4px"
          >
            <el-option
              v-for="p in propertyOptions"
              :key="p.id"
              :label="propertyLabel(p)"
              :value="p.id"
            />
          </el-select>
        </div>
        <div class="full">
          <label>可查看房源隐私</label>
          <select v-model="form.canViewPrivacy" style="width: 100%; margin-top: 4px">
            <option :value="true">允许</option>
            <option :value="false">禁止</option>
          </select>
        </div>
        <div class="full">
          <label>备注</label>
          <input v-model="form.remark" type="text" maxlength="255" placeholder="可选" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 18px">
        <button type="button" class="btn btn-primary" @click="onSave">保存</button>
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
</style>
