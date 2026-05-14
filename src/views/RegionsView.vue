<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteRegionDef,
  fetchRegionBindings,
  fetchRegionDefs,
  fetchStaffList,
  postRegionDef,
  putRegionDef,
  saveRegionBindings,
} from '@/api/admin'
import type { RegionBindingRow, RegionDefRow, StaffRow } from '@/types/domain'
import { Check, Close, Delete, Edit } from '@element-plus/icons-vue'

const defs = ref<RegionDefRow[]>([])
const bindings = ref<RegionBindingRow[]>([])
const staffList = ref<StaffRow[]>([])
const saving = ref(false)

const newName = ref('')
const editId = ref<number | null>(null)
const editName = ref('')

async function loadDefs() {
  const { list } = await fetchRegionDefs()
  defs.value = list
}

async function loadStaff() {
  const { list } = await fetchStaffList({})
  staffList.value = list
}

async function loadBindings() {
  const b = await fetchRegionBindings()
  bindings.value = b.list.length ? b.list.map((r) => ({ ...r })) : []
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
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '新增失败')
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
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '保存失败')
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
    await loadBindings()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '删除失败')
  }
}

function bindingSet(row: RegionBindingRow) {
  return new Set(
    String(row.nodeIds || '')
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

function toggleBinding(row: RegionBindingRow, name: string) {
  const set = bindingSet(row)
  if (set.has(name)) set.delete(name)
  else set.add(name)
  row.nodeIds = Array.from(set).join(',')
}

function addBinding() {
  bindings.value.push({ staffName: '', nodeIds: '' })
}

function removeBinding(i: number) {
  bindings.value.splice(i, 1)
}

async function onSaveBindings() {
  for (const r of bindings.value) {
    if (!String(r.staffName || '').trim()) {
      ElMessage.warning('每条绑定请选择员工')
      return
    }
  }
  saving.value = true
  try {
    await saveRegionBindings(bindings.value.map((x) => ({ ...x })))
    ElMessage.success('绑定已保存')
    await loadBindings()
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadDefs(), loadStaff(), loadBindings()])
})
</script>

<template>
  <section class="panel active regions-page">
    <p class="regions-hint">
      左侧维护业务区域名称（与房源「区域」、员工负责区域使用同一套名称）；右侧为员工授权多个区域及导出/查看策略。
    </p>
    <div class="regions-split">
      <div class="regions-col card-like regions-col-left">
        <h3 class="col-title">区域名称</h3>
        <p class="col-sub">新增 / 编辑 / 删除；不展示内部编号。</p>
        <div class="add-row">
          <input v-model="newName" type="text" maxlength="64" placeholder="新区域名称" class="inp" />
          <button type="button" class="btn btn-primary" @click="onAddRegion">新增</button>
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
                  <el-tooltip content="保存" placement="top">
                    <el-button type="success" :icon="Check" circle plain size="small" @click="onSaveEdit" />
                  </el-tooltip>
                  <el-tooltip content="取消" placement="top">
                    <el-button :icon="Close" circle plain size="small" @click="cancelEdit" />
                  </el-tooltip>
                </template>
                <template v-else>
                  <el-tooltip content="编辑" placement="top">
                    <el-button type="primary" :icon="Edit" circle plain size="small" @click="startEdit(row)" />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button type="danger" :icon="Delete" circle plain size="small" @click="onDeleteRegion(row)" />
                  </el-tooltip>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="defs.length === 0" class="empty">暂无区域，请先新增。</p>
      </div>

      <div class="regions-col card-like regions-col-right">
        <h3 class="col-title">员工区域绑定</h3>
        <p class="col-sub">勾选区域名（与左侧一致）；保存后写入 region_bindings。</p>
        <div class="regions-bind-scroll">
        <div v-if="bindings.length === 0" class="empty">暂无绑定，点击下方新增。</div>
        <div v-for="(r, i) in bindings" :key="i" class="bind-block">
          <div class="bind-row-top">
            <span class="bind-n" :title="`第 ${i + 1} 条`">{{ i + 1 }}</span>
            <select v-model="r.staffName" class="sel sel-staff" aria-label="员工">
              <option value="" disabled>选择员工</option>
              <option v-for="s in staffList" :key="s.id" :value="s.name">{{ s.name }} · {{ s.employeeNo }}</option>
            </select>
            <el-tooltip content="移除" placement="top">
              <el-button type="danger" :icon="Delete" circle plain size="small" class="bind-remove" @click="removeBinding(i)" />
            </el-tooltip>
          </div>
          <div class="bind-row-chips">
            <span class="bind-chips-lbl">区域</span>
            <div class="chip-toggle region-chips region-chips-dense" data-multi>
              <span
                v-for="d in defs"
                :key="d.id"
                :class="{ on: bindingSet(r).has(d.name) }"
                @click="toggleBinding(r, d.name)"
                >{{ d.name }}</span
              >
            </div>
          </div>
        </div>
        </div>
        <div class="foot">
          <button type="button" class="btn" @click="addBinding">＋ 新增绑定</button>
          <button type="button" class="btn btn-primary" :disabled="saving" @click="onSaveBindings">保存绑定</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.regions-col-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 150px);
}

.regions-bind-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.regions-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px;
  line-height: 1.55;
}

.regions-page {
  width: 100%;
}

.regions-split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

@media (max-width: 960px) {
  .regions-split {
    grid-template-columns: 1fr;
  }

  .regions-col-right {
    max-height: none;
  }
}

.card-like {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  padding: 16px 18px 18px;
  box-shadow: 0 6px 22px rgba(15, 23, 42, 0.05);
  min-width: 0;
  box-sizing: border-box;
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

.btn-tiny {
  padding: 4px 10px;
  font-size: 12px;
  margin-right: 6px;
}

.btn-tiny.danger {
  color: #e11d48;
}

.btn-tiny.ghost {
  background: transparent;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #475569;
}

.empty {
  font-size: 13px;
  color: #94a3b8;
  padding: 8px 0;
}

.bind-block {
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 10px;
  padding: 8px 10px 10px;
  margin-bottom: 8px;
  background: #fafbfc;
}

.bind-row-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.bind-n {
  flex-shrink: 0;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #4f46e5;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.sel {
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  font-size: 13px;
  outline: none;
}

.sel-staff {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
}

.bind-remove {
  flex-shrink: 0;
  margin-right: 0;
  padding: 4px 8px;
  font-size: 11px;
}

.bind-row-chips {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 0;
}

.bind-chips-lbl {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  line-height: 22px;
  padding-top: 2px;
}

.region-chips-dense {
  flex: 1;
  min-width: 0;
  gap: 6px;
}

.bind-block .region-chips-dense span {
  padding: 3px 8px;
  font-size: 11px;
}

.foot {
  flex-shrink: 0;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
