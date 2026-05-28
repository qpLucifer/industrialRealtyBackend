<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteRegionDef,
  fetchRegionDefs,
  postRegionDef,
  putRegionDef,
  repairRegionDefLabels,
} from '@/api/admin'
import type { RegionDefRow } from '@/types/domain'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { Check, Close, Delete, Edit } from '@element-plus/icons-vue'

const { listPage, listPageSize, listTotal, applyPagedResult, listQueryParams } = useAdminListPagination()
const defs = ref<RegionDefRow[]>([])

const newName = ref('')
const editId = ref<number | null>(null)
const editName = ref('')
const repairing = ref(false)

async function loadDefs() {
  const result = await fetchRegionDefs(listQueryParams())
  defs.value = result.list
  applyPagedResult(result)
}

async function onAddRegion() {
  const n = newName.value.trim()
  if (!n) {
    ElMessage.warning('请输入区域名称')
    return
  }
  if (n.length > 64) {
    ElMessage.warning('名称不超过 64 字')
    return
  }
  try {
    await postRegionDef(n)
    ElMessage.success('已新增')
    newName.value = ''
    await loadDefs()
  } catch {
    /* http interceptor shows API error */
  }
}

function startEdit(row: RegionDefRow) {
  editId.value = row.id
  editName.value = row.name
}

function cancelEdit() {
  editId.value = null
  editName.value = ''
}

async function onSaveEdit() {
  if (editId.value == null) return
  const n = editName.value.trim()
  if (!n) {
    ElMessage.warning('名称不能为空')
    return
  }
  try {
    await putRegionDef(editId.value, n)
    ElMessage.success('已保存')
    cancelEdit()
    await loadDefs()
  } catch {
    /* http interceptor shows API error */
  }
}

async function onRepairLabels() {
  if (repairing.value) return
  try {
    await ElMessageBox.confirm(
      '将根据当前区域字典，把员工、房源、客户、工业土地里已绑定区域 ID 的显示名称全部对齐。用于修复历史改名未同步的数据。是否继续？',
      '同步引用名称',
      { type: 'info', confirmButtonText: '开始同步', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  repairing.value = true
  try {
    const r = await repairRegionDefLabels()
    ElMessage.success(`已同步（${r.regionCount} 个区域，约 ${r.rowsTouched} 处更新）`)
    await loadDefs()
  } catch {
    /* http interceptor */
  } finally {
    repairing.value = false
  }
}

async function onDeleteRegion(row: RegionDefRow) {
  try {
    await ElMessageBox.confirm(`确定删除区域「${row.name}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteRegionDef(row.id)
    ElMessage.success('已删除')
    await loadDefs()
  } catch {
    /* http interceptor shows API error */
  }
}

onMounted(loadDefs)
</script>

<template>
  <section class="panel active regions-page">
    <div class="regions-single card-like">
      <h3 class="col-title">区域名称</h3>
      <p class="col-sub">
        新增 / 编辑 / 删除；与列表筛选、小程序数据范围使用同一套名称。修改区域名后会自动同步员工、房源、客户、工业土地等已引用处的显示名称。
      </p>
      <div class="add-row">
        <input v-model="newName" type="text" maxlength="64" placeholder="新区域名称" class="inp" />
        <button type="button" class="btn btn-primary" @click="onAddRegion">新增</button>
        <button type="button" class="btn" :disabled="repairing" @click="onRepairLabels">
          {{ repairing ? '同步中…' : '同步引用名称' }}
        </button>
      </div>
      <table class="data region-table">
        <thead>
          <tr>
            <th>区域名</th>
            <th style="width: 140px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in defs" :key="row.id">
            <td>
              <template v-if="editId === row.id">
                <input v-model="editName" type="text" maxlength="64" class="inp inp-sm" />
              </template>
              <template v-else>{{ row.name }}</template>
            </td>
            <td>
              <template v-if="editId === row.id">
                <TableActionBtn title="保存" :icon="Check" variant="success" @click="onSaveEdit" />
                <TableActionBtn title="取消" :icon="Close" variant="neutral" @click="cancelEdit" />
              </template>
              <template v-else>
                <TableActionBtn title="编辑" :icon="Edit" @click="startEdit(row)" />
                <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDeleteRegion(row)" />
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminListPagination
      v-model:page="listPage"
      v-model:page-size="listPageSize"
      :total="listTotal"
      @change="loadDefs"
    />
    <p v-if="defs.length === 0" class="empty">暂无区域，请先新增。</p>
  </section>
</template>

<style scoped>
.regions-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.55;
}

.regions-page {
  width: 100%;
}

.card-like {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  padding: 16px 18px 18px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.05);
}

.col-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.col-sub {
  margin: 0 0 12px;
  font-size: 12px;
  color: #94a3b8;
}

.add-row {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.inp {
  flex: 1;
  min-width: 140px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 14px;
}

.inp-sm {
  width: 100%;
  max-width: 220px;
}

.region-table {
  margin-top: 0;
}

.empty {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
}
</style>
