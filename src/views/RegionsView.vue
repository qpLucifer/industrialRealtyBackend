<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteRegionDef, fetchRegionDefs, postRegionDef, putRegionDef } from '@/api/admin'
import type { RegionDefRow } from '@/types/domain'
import { Check, Close, Delete, Edit } from '@element-plus/icons-vue'

const defs = ref<RegionDefRow[]>([])

const newName = ref('')
const editId = ref<number | null>(null)
const editName = ref('')

async function loadDefs() {
  const { list } = await fetchRegionDefs()
  defs.value = list
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
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '删除失败')
  }
}

onMounted(loadDefs)
</script>

<template>
  <section class="panel active regions-page">
    <p class="regions-hint">
      在此维护业务区域名称；房源「所属区域」、员工「负责区域」下拉选项均来自本列表。员工具体负责哪几个区域请在<strong>员工与账号</strong>中编辑，无需在本页重复绑定。
    </p>
    <div class="regions-single card-like">
      <h3 class="col-title">区域名称</h3>
      <p class="col-sub">新增 / 编辑 / 删除；与列表筛选、小程序数据范围使用同一套名称。</p>
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
