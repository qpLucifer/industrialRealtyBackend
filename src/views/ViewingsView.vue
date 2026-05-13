<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchViewingsSummary } from '@/api/admin'
import type { DealRow, ViewingRow } from '@/types/domain'

const viewings = ref<ViewingRow[]>([])
const deals = ref<DealRow[]>([])

onMounted(async () => {
  const d = await fetchViewingsSummary()
  viewings.value = d.viewings
  deals.value = d.deals
})
</script>

<template>
  <section class="panel active">
    <div class="grid-2">
      <div class="card">
        <h3>带看台账字段</h3>
        <table class="data" style="margin-top: 8px">
          <thead>
            <tr>
              <th>开始</th>
              <th>结束</th>
              <th>房源</th>
              <th>客户</th>
              <th>陪同</th>
              <th>评分</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in viewings" :key="i">
              <td>{{ r.start }}</td>
              <td>{{ r.end }}</td>
              <td>{{ r.propertyRef }}</td>
              <td>{{ r.customerName }}</td>
              <td>{{ r.companions }}</td>
              <td>{{ r.score }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h3>成交备案字段</h3>
        <table class="data" style="margin-top: 8px">
          <thead>
            <tr>
              <th>合同类型</th>
              <th>成交额</th>
              <th>佣金</th>
              <th>开票</th>
              <th>归档</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in deals" :key="i">
              <td>{{ r.contractType }}</td>
              <td>{{ r.amount }}</td>
              <td>{{ r.commission }}</td>
              <td>{{ r.invoiceType }}</td>
              <td><span class="tag mint">{{ r.archiveStatus }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="hint" style="margin-top: 12px">预留：回款分期、发票号、对账单号、业绩拆分占比。</p>
      </div>
    </div>
  </section>
</template>
