<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchDashboard } from '@/api/admin'
import type { KpiItem, RegionBar, StaffActivityRow } from '@/types/domain'

const kpis = ref<KpiItem[]>([])
const regionBars = ref<RegionBar[]>([])
const staffActivity = ref<StaffActivityRow[]>([])

onMounted(async () => {
  const data = await fetchDashboard()
  kpis.value = data.kpis
  regionBars.value = data.regionBars
  staffActivity.value = data.staffActivity
})
</script>

<template>
  <section class="panel active">
    <div class="kpi-grid">
      <div v-for="k in kpis" :key="k.label" class="kpi">
        <label>{{ k.label }}</label>
        <div class="val">{{ k.value }}</div>
        <div class="trend">{{ k.trend }}</div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>区域房源分布</h3>
        <div class="bars">
          <div v-for="b in regionBars" :key="b.label" class="bar" :style="{ height: b.heightPct + '%' }">
            <span>{{ b.label }}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <h3>员工跟进活跃（7 日）</h3>
        <table class="data">
          <thead>
            <tr>
              <th>员工</th>
              <th>跟进</th>
              <th>带看</th>
              <th>成交单</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in staffActivity" :key="r.name">
              <td>{{ r.name }}</td>
              <td>{{ r.followUps }}</td>
              <td>{{ r.viewings }}</td>
              <td>{{ r.deals }}</td>
            </tr>
          </tbody>
        </table>
        <p class="hint" style="margin-top: 12px">经理视图自动限定所辖下属；字段可配置导出黑名单。</p>
      </div>
    </div>
    <div class="card">
      <h3>指标说明</h3>
      <p class="hint">本页为示意数据。生产可接入 ECharts / BI：成交曲线、区域热力、员工排行榜、意向漏斗等。</p>
    </div>
  </section>
</template>
