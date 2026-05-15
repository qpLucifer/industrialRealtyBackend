<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPropertyDraft, deletePropertyApi, fetchCodeMasterItems, fetchProperties, fetchRegionDefs } from '@/api/admin'
import type { PropertyRow, RegionDefRow } from '@/types/domain'
import PropertyFullModal from '@/components/PropertyFullModal.vue'
import { Delete, Edit, View } from '@element-plus/icons-vue'

const list = ref<PropertyRow[]>([])
const regionDefs = ref<RegionDefRow[]>([])

const modalVisible = ref(false)
const modalCode = ref('P-8821')
const modalMode = ref<'edit' | 'view'>('edit')

const filterType = ref<string>('all')
const filterStatus = ref<string>('all')
const filterDistrict = ref<string>('all')
const searchQ = ref('')

async function loadRegionDefs() {
  const { list: rows } = await fetchRegionDefs()
  regionDefs.value = rows
}

async function loadList() {
  const { list: rows } = await fetchProperties({
    type: filterType.value,
    status: filterStatus.value,
    district: filterDistrict.value,
    q: searchQ.value,
  })
  list.value = rows
}

const FALLBACK_PROPERTY_TYPES = ['标准厂房', '独门独院厂房', '仓库', '工业用地', '写字楼', '产业园商铺']
const FALLBACK_PROPERTY_STATUSES = ['草稿', '待审核', '驳回', '待租', '已租', '待售', '已售', '意向中', '下架封存']

const propertyTypeFilterLabels = ref<string[]>([...FALLBACK_PROPERTY_TYPES])
const propertyStatusFilterLabels = ref<string[]>([...FALLBACK_PROPERTY_STATUSES])

async function loadCodeFilters() {
  try {
    const [t, s] = await Promise.all([
      fetchCodeMasterItems('property_type'),
      fetchCodeMasterItems('property_status_tag'),
    ])
    if (t.list.length) propertyTypeFilterLabels.value = t.list.map((r) => r.label)
    else propertyTypeFilterLabels.value = [...FALLBACK_PROPERTY_TYPES]
    if (s.list.length) propertyStatusFilterLabels.value = s.list.map((r) => r.label)
    else propertyStatusFilterLabels.value = [...FALLBACK_PROPERTY_STATUSES]
  } catch {
    propertyTypeFilterLabels.value = [...FALLBACK_PROPERTY_TYPES]
    propertyStatusFilterLabels.value = [...FALLBACK_PROPERTY_STATUSES]
  }
}

onMounted(async () => {
  await loadRegionDefs()
  await loadCodeFilters()
  await loadList()
})

function statusTagClass(s: string) {
  if (s === '待租') return 'mint'
  if (s === '待审核') return 'amber'
  if (s === '驳回') return 'rose'
  if (s === '意向中') return 'amber'
  if (s === '草稿') return 'neutral'
  if (s === '已租' || s === '已售') return 'cyan'
  if (s === '下架封存' || s === '待售') return 'rose'
  return 'mint'
}

function openProp(mode: 'edit' | 'view', code: string) {
  modalMode.value = mode
  modalCode.value = code
  modalVisible.value = true
}

async function onNewDraft() {
  const { code } = await createPropertyDraft({})
  ElMessage.success(`已创建草稿 ${code}`)
  await loadList()
  openProp('edit', code)
}

async function onDeleteRow(row: PropertyRow) {
  try {
    await ElMessageBox.confirm(`确定删除房源 ${row.code}？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  await deletePropertyApi(row.code)
  ElMessage.success('已删除')
  await loadList()
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px">
      <select v-model="filterType">
        <option value="all">全部类型</option>
        <option v-for="x in propertyTypeFilterLabels" :key="x" :value="x">{{ x }}</option>
      </select>
      <select v-model="filterDistrict">
        <option value="all">全部区域</option>
        <option v-for="d in regionDefs" :key="d.id" :value="d.name">{{ d.name }}</option>
      </select>
      <select v-model="filterStatus">
        <option value="all">全部状态</option>
        <option v-for="x in propertyStatusFilterLabels" :key="x" :value="x">{{ x }}</option>
      </select>
      <input v-model="searchQ" type="search" placeholder="地址 / 编号 / 提交人…" style="min-width: 200px" @keyup.enter="loadList" />
      <button type="button" class="btn btn-primary" @click="onNewDraft">＋ 新建草稿</button>
      <button type="button" class="btn btn-primary" @click="loadList">查询</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>编号</th>
            <th>房源</th>
            <th>区域</th>
            <th>类型</th>
            <th>状态</th>
            <th>提交人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0">
            <td colspan="7" class="hint" style="padding: 24px; text-align: center">暂无数据，请调整筛选或新建草稿。</td>
          </tr>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.code }}</td>
            <td>{{ r.title }}</td>
            <td>{{ r.district }}</td>
            <td>{{ r.type }}</td>
            <td><span class="tag" :class="statusTagClass(r.status)">{{ r.status }}</span></td>
            <td>{{ r.submitter }}</td>
            <td class="table-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" :icon="Edit" circle plain size="small" @click="openProp('edit', r.code)" />
              </el-tooltip>
              <el-tooltip content="详情" placement="top">
                <el-button type="primary" :icon="View" circle plain size="small" @click="openProp('view', r.code)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" :icon="Delete" circle plain size="small" @click="onDeleteRow(r)" />
              </el-tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PropertyFullModal v-model:visible="modalVisible" :code="modalCode" :mode="modalMode" @saved="loadList" />
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
