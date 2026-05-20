<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createCodeMasterItem,
  deleteCodeMasterItem,
  fetchCodeMasterItems,
  fetchCodeMasterTypes,
  updateCodeMasterItem,
} from '@/api/admin'
import type { CodeMasterRow, CodeMasterTypeInfo } from '@/types/domain'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { Delete, Edit } from '@element-plus/icons-vue'

const types = ref<CodeMasterTypeInfo[]>([])
const selectedType = ref('staff_department')
const rows = ref<CodeMasterRow[]>([])
const loading = ref(false)

const modal = ref(false)
const editing = ref<CodeMasterRow | null>(null)
const form = ref({
  itemCode: '',
  label: '',
  sortOrder: 0,
  isActive: true,
  remark: '',
})

const typeName = computed(() => types.value.find((t) => t.typeCode === selectedType.value)?.typeName ?? selectedType.value)

function rowActive(r: CodeMasterRow) {
  return !(r.isActive === false || r.isActive === 0)
}

async function loadTypes() {
  const { list } = await fetchCodeMasterTypes()
  types.value = list
  if (!list.some((t) => t.typeCode === selectedType.value) && list[0]) {
    selectedType.value = list[0].typeCode
  }
}

async function loadRows() {
  loading.value = true
  try {
    const { list } = await fetchCodeMasterItems(selectedType.value, { includeInactive: true })
    rows.value = list
  } finally {
    loading.value = false
  }
}

watch(selectedType, () => {
  void loadRows()
})

onMounted(async () => {
  await loadTypes()
  await loadRows()
})

function openCreate() {
  editing.value = null
  form.value = { itemCode: '', label: '', sortOrder: 0, isActive: true, remark: '' }
  modal.value = true
}

function openEdit(row: CodeMasterRow) {
  editing.value = row
  form.value = {
    itemCode: row.itemCode,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: rowActive(row),
    remark: row.remark || '',
  }
  modal.value = true
}

async function onSaveModal() {
  const itemCode = form.value.itemCode.trim().toLowerCase()
  const label = form.value.label.trim()
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(itemCode)) {
    ElMessage.warning('编码 itemCode：小写字母开头，仅 a-z 0-9 _，最长 64')
    return
  }
  if (!label) {
    ElMessage.warning('请填写显示名称')
    return
  }
  const payload = {
    typeCode: selectedType.value,
    itemCode,
    label,
    sortOrder: Number.isFinite(Number(form.value.sortOrder)) ? Number(form.value.sortOrder) : 0,
    isActive: form.value.isActive,
    remark: form.value.remark.trim() || null,
  }
  try {
    if (editing.value) {
      await updateCodeMasterItem(editing.value.id, payload)
      ElMessage.success('已保存')
    } else {
      await createCodeMasterItem(payload)
      ElMessage.success('已新增')
    }
    modal.value = false
    await loadRows()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '保存失败')
  }
}

async function onDelete(row: CodeMasterRow) {
  try {
    await ElMessageBox.confirm(`删除「${row.label}」(${row.itemCode})？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteCodeMasterItem(row.id)
    ElMessage.success('已删除')
    await loadRows()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '删除失败')
  }
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px; align-items: center">
      <label class="hint" style="margin: 0">字典类型</label>
      <select v-model="selectedType" style="min-width: 220px">
        <option v-for="t in types" :key="t.typeCode" :value="t.typeCode">{{ t.typeName }}（{{ t.typeCode }}）</option>
      </select>
      <button type="button" class="btn btn-primary" @click="openCreate">＋ 新增项</button>
      <button type="button" class="btn" :disabled="loading" @click="loadRows">刷新</button>
    </div>
    <p class="hint" style="margin: 10px 0 14px">
      {{ typeName }}：维护选项编码与展示文案；业务表单下拉从此处加载。修改「显示名称」会影响新保存的数据展示；历史数据仍保留旧字符串直至被编辑保存。
    </p>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th style="width: 72px">ID</th>
            <th style="width: 140px">itemCode</th>
            <th>显示名称</th>
            <th style="width: 88px">排序</th>
            <th style="width: 88px">启用</th>
            <th>备注</th>
            <th style="width: 120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && rows.length === 0">
            <td colspan="7" class="hint" style="padding: 24px; text-align: center">暂无数据</td>
          </tr>
          <tr v-for="r in rows" :key="r.id">
            <td>{{ r.id }}</td>
            <td class="cell-mono">{{ r.itemCode }}</td>
            <td>{{ r.label }}</td>
            <td>{{ r.sortOrder }}</td>
            <td>{{ rowActive(r) ? '是' : '否' }}</td>
            <td class="cell-wrap hint-sm">{{ r.remark || '—' }}</td>
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

    <Teleport to="body">
      <div class="modal-center" :class="{ show: modal }" @click.self="modal = false">
        <div class="modal-box" style="max-width: 480px">
          <h3>{{ editing ? '编辑字典项' : '新增字典项' }}</h3>
          <p class="hint" style="margin-top: 8px">类型：<strong>{{ typeName }}</strong>（{{ selectedType }}）</p>
          <div class="form-grid" style="margin-top: 14px">
            <div>
              <label>itemCode<span style="color: var(--rose)">*</span></label>
              <input
                v-model="form.itemCode"
                type="text"
                maxlength="64"
                :disabled="Boolean(editing)"
                placeholder="如 sales、hq"
                class="cell-mono"
              />
            </div>
            <div class="full">
              <label>显示名称<span style="color: var(--rose)">*</span></label>
              <input v-model="form.label" type="text" maxlength="255" placeholder="中文或对外展示文案" />
            </div>
            <div>
              <label>排序</label>
              <input v-model.number="form.sortOrder" type="number" step="1" />
            </div>
            <div>
              <label>启用</label>
              <select v-model="form.isActive">
                <option :value="true">是</option>
                <option :value="false">否</option>
              </select>
            </div>
            <div class="full">
              <label>备注</label>
              <input v-model="form.remark" type="text" maxlength="255" placeholder="可选" />
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 18px; justify-content: flex-end">
            <button type="button" class="btn" @click="modal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onSaveModal">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.cell-wrap {
  max-width: 200px;
  word-break: break-word;
}
.cell-mono {
  font-family: ui-monospace, monospace;
  font-size: 13px;
}
.hint-sm {
  font-size: 12px;
  color: #64748b;
}
</style>
