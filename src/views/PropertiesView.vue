<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createPropertyDraft, deletePropertyApi, fetchProperties, fetchRegionDefs, postPropertiesBulkFollow } from '@/api/admin'
import type { PropertyRow, RegionDefRow } from '@/types/domain'
import PropertyFullModal from '@/components/PropertyFullModal.vue'

const list = ref<PropertyRow[]>([])
const regionDefs = ref<RegionDefRow[]>([])
const checkAll = ref(false)
const checks = ref<Record<string, boolean>>({})

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
  list.value = rows.map((r) => ({
    ...r,
    followUpDone: /已跟进/.test(String(r.listingLine2 || '')),
  }))
  const next: Record<string, boolean> = {}
  rows.forEach((r) => {
    next[r.id] = checks.value[r.id] ?? false
  })
  checks.value = next
}

onMounted(async () => {
  await loadRegionDefs()
  await loadList()
})

function statusTagClass(s: string) {
  if (s === '待租') return 'mint'
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

function onCheckAll() {
  list.value.forEach((r) => {
    checks.value[r.id] = checkAll.value
  })
}

const checkedCodes = computed(() => list.value.filter((r) => checks.value[r.id]).map((r) => r.code))

async function onBulk() {
  const codes = checkedCodes.value
  if (!codes.length) {
    ElMessage.warning('请先勾选表格中的房源行')
    return
  }
  try {
    await ElMessageBox.confirm(`将对 ${codes.length} 条房源写入跟进记录，是否继续？`, '批量已跟进', {
      type: 'warning',
    })
  } catch {
    return
  }
  await postPropertiesBulkFollow(codes, '管理员')
  ElMessage.success('已批量标记')
  await loadList()
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px">
      <select v-model="filterType">
        <option value="all">全部类型</option>
        <option>标准厂房</option>
        <option>独门独院厂房</option>
        <option>仓库</option>
        <option>工业用地</option>
        <option>写字楼</option>
        <option>产业园商铺</option>
      </select>
      <select v-model="filterDistrict">
        <option value="all">全部区域</option>
        <option v-for="d in regionDefs" :key="d.id" :value="d.name">{{ d.name }}</option>
      </select>
      <select v-model="filterStatus">
        <option value="all">全部状态</option>
        <option>草稿</option>
        <option>待租</option>
        <option>已租</option>
        <option>待售</option>
        <option>已售</option>
        <option>意向中</option>
        <option>下架封存</option>
      </select>
      <input v-model="searchQ" type="search" placeholder="地址 / 编号 / 提交人…" style="min-width: 200px" @keyup.enter="loadList" />
      <button type="button" class="btn btn-primary" @click="onNewDraft">＋ 新建草稿</button>
      <button type="button" class="btn btn-primary" @click="loadList">查询</button>
      <button type="button" class="btn btn-primary" @click="onBulk">批量标记已跟进</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center">
              <input v-model="checkAll" type="checkbox" title="全选本页" @change="onCheckAll" />
            </th>
            <th>编号</th>
            <th>房源</th>
            <th>区域</th>
            <th>类型</th>
            <th>状态</th>
            <th>跟进</th>
            <th>提交人</th>
            <th>审核</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="list.length === 0">
            <td colspan="10" class="hint" style="padding: 24px; text-align: center">暂无数据，请调整筛选或新建草稿。</td>
          </tr>
          <tr v-for="r in list" :key="r.id">
            <td style="text-align: center">
              <input v-model="checks[r.id]" type="checkbox" />
            </td>
            <td>{{ r.code }}</td>
            <td>{{ r.title }}</td>
            <td>{{ r.district }}</td>
            <td>{{ r.type }}</td>
            <td><span class="tag" :class="statusTagClass(r.status)">{{ r.status }}</span></td>
            <td>
              <span class="tag" :class="r.followUpDone ? 'mint' : 'neutral'">{{ r.followUpDone ? '已跟进' : '未跟进' }}</span>
            </td>
            <td>{{ r.submitter }}</td>
            <td>
              <span v-if="r.audit === '—'">—</span>
              <span v-else class="tag" :class="r.audit === '已通过' ? 'mint' : 'amber'">{{ r.audit }}</span>
            </td>
            <td style="white-space: nowrap">
              <button type="button" class="btn btn-primary" @click="openProp('edit', r.code)">编辑</button>
              <button type="button" class="btn" @click="openProp('view', r.code)">详情</button>
              <button type="button" class="btn" style="color: var(--rose)" @click="onDeleteRow(r)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PropertyFullModal v-model:visible="modalVisible" :code="modalCode" :mode="modalMode" @saved="loadList" />
  </section>
</template>
