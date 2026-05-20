<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout, UniversalTransition } from 'echarts/features'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer, LabelLayout, UniversalTransition])

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchDashboard } from '@/api/admin'
import type { KpiItem, RegionBar, StaffActivityRow } from '@/types/domain'

const kpis = ref<KpiItem[]>([])
const regionBars = ref<RegionBar[]>([])
const staffActivity = ref<StaffActivityRow[]>([])

const chartEl = ref<HTMLElement | null>(null)
let chart: ReturnType<typeof echarts.init> | null = null
let ro: ResizeObserver | null = null

const barPalette = ['#1a3a6c', '#2d4f8c', '#4a6fa8', '#64748b', '#94a3b8', '#c5d4e8']

function disposeChart() {
  ro?.disconnect()
  ro = null
  chart?.dispose()
  chart = null
}

function renderRegionChart(bars: RegionBar[]) {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value, undefined, { renderer: 'canvas' })

  const sorted = [...bars].sort((a, b) => (Number(b.count) || 0) - (Number(a.count) || 0))
  const labels = sorted.map((b) => b.label)
  const values = sorted.map((b) => (typeof b.count === 'number' ? b.count : Math.round((b.heightPct / 100) * 100) || 0))

  chart.setOption(
    {
      backgroundColor: 'transparent',
      grid: { left: 8, right: 36, top: 10, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15,23,42,0.88)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (p: unknown) => {
          const arr = Array.isArray(p) ? p : [p]
          const x = arr[0] as { name?: string; value?: number }
          return `${x.name ?? ''}：${x.value ?? 0} 套`
        },
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: 'rgba(15,23,42,0.06)', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: {
              color: barPalette[i % barPalette.length],
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barWidth: '52%',
          barCategoryGap: '32%',
          label: { show: true, position: 'right', fontSize: 11, color: '#64748b', formatter: (p: { value?: number }) => String(p.value ?? '') },
          animationDuration: 600,
          animationEasing: 'cubicOut',
        },
      ],
    },
    { notMerge: true },
  )
  chart.resize()
}

watch(regionBars, (b) => nextTick(() => renderRegionChart(b)), { deep: true })

onMounted(async () => {
  const data = await fetchDashboard()
  kpis.value = data.kpis
  regionBars.value = data.regionBars
  staffActivity.value = data.staffActivity
  await nextTick()
  renderRegionChart(regionBars.value)
  if (chartEl.value && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => chart?.resize())
    ro.observe(chartEl.value)
  }
  window.addEventListener('resize', onWinResize)
})

function onWinResize() {
  chart?.resize()
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWinResize)
  disposeChart()
})
</script>

<template>
  <section class="panel active dashboard-page">
    <div class="dash-kpis">
      <article v-for="k in kpis" :key="k.label" class="dash-kpi-card">
        <p class="dash-kpi-label">{{ k.label }}</p>
        <p class="dash-kpi-value">{{ k.value }}</p>
      </article>
    </div>

    <div class="dash-row">
      <div class="dash-card">
        <h3 class="dash-h3">区域房源分布</h3>
        <div ref="chartEl" class="dash-chart" />
      </div>
      <div class="dash-card">
        <h3 class="dash-h3">员工跟进活跃（7 日）</h3>
        <div class="dash-table-wrap">
          <table class="data dash-table">
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
          <p v-if="staffActivity.length === 0" class="dash-empty">暂无员工活跃数据。</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
}

.dash-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}

@media (max-width: 1100px) {
  .dash-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-kpi-card {
  padding: 18px 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
}

.dash-kpi-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 8px;
}

.dash-kpi-value {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
}

.dash-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 960px) {
  .dash-row {
    grid-template-columns: 1fr;
  }
}

.dash-card {
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.07);
  padding: 14px 16px 16px;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
  min-width: 0;
}

.dash-h3 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.dash-chart {
  width: 100%;
  height: 260px;
}

.dash-table-wrap {
  overflow: auto;
}

.dash-table {
  margin-top: 0;
}

.dash-empty {
  margin: 12px 0 0;
  font-size: 13px;
  color: #94a3b8;
}
</style>
