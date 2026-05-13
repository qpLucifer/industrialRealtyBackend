<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchProperties } from '@/api/admin'
import type { PropertyRow } from '@/types/domain'
import PropertyFullModal from '@/components/PropertyFullModal.vue'

const list = ref<PropertyRow[]>([])
const checkAll = ref(false)
const checks = ref<Record<string, boolean>>({})

const modalVisible = ref(false)
const modalCode = ref('P-8821')
const modalMode = ref<'edit' | 'view'>('edit')

onMounted(async () => {
  const { list: rows } = await fetchProperties()
  list.value = rows
  rows.forEach((r) => {
    checks.value[r.id] = false
  })
})

function statusTagClass(s: string) {
  if (s === '待租') return 'mint'
  if (s === '意向中') return 'amber'
  if (s === '草稿') return 'neutral'
  return 'mint'
}

function listingTagClass(row: PropertyRow) {
  if (row.listingLine1.includes('已上架')) return 'mint'
  if (row.listingLine1.includes('待审核')) return 'amber'
  return 'neutral'
}

function openProp(mode: 'edit' | 'view', code: string) {
  modalMode.value = mode
  modalCode.value = code
  modalVisible.value = true
}

function onCheckAll() {
  list.value.forEach((r) => {
    checks.value[r.id] = checkAll.value
  })
}

const checkedCount = computed(() => list.value.filter((r) => checks.value[r.id]).length)

function onBulk() {
  const n = checkedCount.value
  ElMessage[n ? 'success' : 'warning'](n ? `已对 ${n} 条执行批量标记（原型）` : '请先勾选表格中的房源行')
}

function onImport() {
  ElMessage.info('打开导入向导（原型）· 校验表头与 region_id 后批量入库')
}

function onExport() {
  ElMessage.info('按当前筛选生成 CSV（原型）· 敏感列按角色掩码')
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px">
      <select>
        <option>全部类型</option>
        <option>标准厂房</option>
        <option>独门独院厂房</option>
        <option>仓库</option>
        <option>工业用地</option>
        <option>写字楼</option>
        <option>产业园商铺</option>
      </select>
      <select>
        <option>全部状态</option>
        <option>待租</option>
        <option>已租</option>
        <option>待售</option>
        <option>已售</option>
        <option>意向中</option>
        <option>下架封存</option>
      </select>
      <input type="search" placeholder="地址 / 编号 / 联系人…" style="min-width: 200px" />
      <button type="button" class="btn btn-primary">查询</button>
      <button type="button" class="btn" @click="onImport">导入 CSV（演示）</button>
      <button type="button" class="btn" @click="onExport">导出筛选结果（演示）</button>
      <button type="button" class="btn btn-primary" @click="onBulk">批量标记「已跟进」（演示）</button>
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
            <th>上架流程</th>
            <th>提交人</th>
            <th>审核</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id" :class="{ 'row-muted': r.rowMuted }">
            <td style="text-align: center">
              <input v-model="checks[r.id]" type="checkbox" />
            </td>
            <td>{{ r.code }}</td>
            <td>{{ r.title }}</td>
            <td>{{ r.district }}</td>
            <td>{{ r.type }}</td>
            <td><span class="tag" :class="statusTagClass(r.status)">{{ r.status }}</span></td>
            <td>
              <span class="tag" :class="listingTagClass(r)">{{ r.listingLine1 }}</span><br />
              <span class="hint" style="font-size: 11px">{{ r.listingLine2 }}</span>
            </td>
            <td>{{ r.submitter }}</td>
            <td>
              <span v-if="r.audit === '—'">—</span>
              <span v-else class="tag" :class="r.audit === '已通过' ? 'mint' : 'amber'">{{ r.audit }}</span>
            </td>
            <td style="white-space: nowrap">
              <button type="button" class="btn btn-primary" @click="openProp('edit', r.code)">编辑</button>
              <button type="button" class="btn" @click="openProp('view', r.code)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PropertyFullModal v-model:visible="modalVisible" :code="modalCode" :mode="modalMode" />
  </section>
</template>
