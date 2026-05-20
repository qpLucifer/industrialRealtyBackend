<script setup lang="ts">
import * as echarts from 'echarts/core'
import { graphic } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout, UniversalTransition } from 'echarts/features'

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
  LabelLayout,
  UniversalTransition,
])

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchDashboard } from '@/api/admin'
import type { KpiItem, RegionBar, StaffActivityRow } from '@/types/domain'

const kpis = ref<KpiItem[]>([])
const regionBars = ref<RegionBar[]>([])
const staffActivity = ref<StaffActivityRow[]>([])
const loading = ref(false)
const loadError = ref('')

const pieEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)
let pieChart: ReturnType<typeof echarts.init> | null = null
let barChart: ReturnType<typeof echarts.init> | null = null
let roPie: ResizeObserver | null = null
let roBar: ResizeObserver | null = null

const chartPalette = ['#1a3a6c', '#2d4f8c', '#4a6fa8', '#5eead4', '#38bdf8', '#94a3b8', '#c5d4e8']

const kpiAccents = [
  { tone: 'navy', icon: 'prop' },
  { tone: 'teal', icon: 'vacant' },
  { tone: 'sky', icon: 'cust' },
  { tone: 'gold', icon: 'deal' },
] as const

const regionTotal = computed(() => regionBars.value.reduce((s, b) => s + regionCount(b), 0))

const hasRegionChartData = computed(() => regionTotal.value > 0)

function regionCount(b: RegionBar) {
  const n = Number(b.count)
  if (Number.isFinite(n) && n >= 0) return n
  const pct = Number(b.heightPct)
  if (!Number.isFinite(pct) || pct <= 0) return 0
  const max = Math.max(...regionBars.value.map((x) => Number(x.count) || 0), 1)
  return Math.round((pct / 100) * max)
}

function disposeCharts() {
  roPie?.disconnect()
  roBar?.disconnect()
  roPie = null
  roBar = null
  pieChart?.dispose()
  barChart?.dispose()
  pieChart = null
  barChart = null
}

function sortedRegions(source: RegionBar[]) {
  return [...source].sort((a, b) => regionCount(b) - regionCount(a))
}

function renderPieChart(bars: RegionBar[]) {
  if (!pieEl.value) return
  pieChart?.dispose()
  pieChart = echarts.init(pieEl.value, undefined, { renderer: 'canvas' })

  const sorted = sortedRegions(bars).filter((b) => regionCount(b) > 0)
  const data = sorted.map((b, i) => ({
    name: b.label,
    value: regionCount(b),
    itemStyle: { color: chartPalette[i % chartPalette.length] },
  }))

  pieChart.setOption(
    {
      backgroundColor: 'transparent',
      color: chartPalette,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderWidth: 0,
        padding: [10, 14],
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (p: { name?: string; value?: number; percent?: number }) =>
          `${p.name ?? ''}<br/>${p.value ?? 0} 套 · ${p.percent ?? 0}%`,
      },
      legend: {
        orient: 'vertical',
        right: 4,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        textStyle: { color: '#475569', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: 'rgba(255,255,255,0.85)',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 700,
              color: '#0f172a',
              formatter: '{b}\n{c} 套',
            },
          },
          labelLine: { show: false },
          data,
          animationDuration: 720,
          animationEasing: 'cubicOut',
        },
      ],
    },
    { notMerge: true },
  )
  pieChart.resize()
}

function renderBarChart(bars: RegionBar[]) {
  if (!barEl.value) return
  barChart?.dispose()
  barChart = echarts.init(barEl.value, undefined, { renderer: 'canvas' })

  const sorted = sortedRegions(bars).filter((b) => regionCount(b) > 0)
  const labels = sorted.map((b) => b.label)
  const values = sorted.map((b) => regionCount(b))

  barChart.setOption(
    {
      backgroundColor: 'transparent',
      grid: { left: 8, right: 28, top: 12, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: 'rgba(26,58,108,0.06)', type: 'dashed' } },
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
              color: new graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: chartPalette[i % chartPalette.length] },
                { offset: 1, color: `${chartPalette[i % chartPalette.length]}99` },
              ]),
              borderRadius: [0, 8, 8, 0],
            },
          })),
          barWidth: '48%',
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            color: '#64748b',
            formatter: (p: { value?: number }) => String(p.value ?? ''),
          },
          animationDuration: 600,
        },
      ],
    },
    { notMerge: true },
  )
  barChart.resize()
}

function renderAllCharts() {
  if (loading.value) return
  renderPieChart(regionBars.value)
  renderBarChart(regionBars.value)
}

function scheduleChartPaint() {
  void nextTick().then(() => {
    requestAnimationFrame(() => {
      renderAllCharts()
      pieChart?.resize()
      barChart?.resize()
    })
  })
}

watch(regionBars, () => scheduleChartPaint(), { deep: true })
watch(loading, (v) => {
  if (!v) scheduleChartPaint()
})

async function loadDashboard() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await fetchDashboard()
    kpis.value = data.kpis ?? []
    regionBars.value = Array.isArray(data.regionBars) ? data.regionBars : []
    staffActivity.value = Array.isArray(data.staffActivity) ? data.staffActivity : []
  } catch {
    loadError.value = '加载失败'
  } finally {
    loading.value = false
  }
  scheduleChartPaint()
}

function bindResize() {
  roPie?.disconnect()
  roBar?.disconnect()
  roPie = null
  roBar = null
  if (pieEl.value && typeof ResizeObserver !== 'undefined') {
    roPie = new ResizeObserver(() => pieChart?.resize())
    roPie.observe(pieEl.value)
  }
  if (barEl.value && typeof ResizeObserver !== 'undefined') {
    roBar = new ResizeObserver(() => barChart?.resize())
    roBar.observe(barEl.value)
  }
}

function onWinResize() {
  pieChart?.resize()
  barChart?.resize()
}

onMounted(async () => {
  await loadDashboard()
  bindResize()
  scheduleChartPaint()
  window.addEventListener('resize', onWinResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWinResize)
  disposeCharts()
})
</script>

<template>
  <section class="panel active dashboard-page">
    <div class="dash-atmosphere" aria-hidden="true">
      <div class="dash-blob dash-blob--a" />
      <div class="dash-blob dash-blob--b" />
      <div class="dash-blob dash-blob--c" />
    </div>

    <header class="dash-header">
      <div>
        <h2 class="dash-title">数据总览</h2>
        <p class="dash-sub">房源、客户与成交核心指标一览</p>
      </div>
      <span v-if="!loading && !loadError" class="dash-live-tag">实时统计</span>
    </header>

    <p v-if="loading" class="dash-status">加载中…</p>
    <p v-else-if="loadError" class="dash-status dash-status--err">
      {{ loadError }}
      <button type="button" class="btn" @click="loadDashboard">重试</button>
    </p>

    <div v-else class="dash-body">
      <div class="dash-kpis">
        <article
          v-for="(k, i) in kpis"
          :key="k.label"
          class="dash-kpi-glass"
          :class="`dash-kpi-glass--${kpiAccents[i % kpiAccents.length]?.tone ?? 'navy'}`"
        >
          <div class="dash-kpi-glass__shine" aria-hidden="true" />
          <div class="dash-kpi-glass__icon" :class="`dash-kpi-icon--${kpiAccents[i % kpiAccents.length]?.icon ?? 'prop'}`" aria-hidden="true">
            <svg v-if="kpiAccents[i % kpiAccents.length]?.icon === 'prop'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <svg v-else-if="kpiAccents[i % kpiAccents.length]?.icon === 'vacant'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M8 12h8M12 8v8" stroke-linecap="round" />
            </svg>
            <svg v-else-if="kpiAccents[i % kpiAccents.length]?.icon === 'cust'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <circle cx="9" cy="8" r="3" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4-3.5" stroke-linecap="round" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="dash-kpi-glass__text">
            <p class="dash-kpi-label">{{ k.label }}</p>
            <p class="dash-kpi-value">{{ k.value }}</p>
            <p v-if="k.trend" class="dash-kpi-trend">{{ k.trend }}</p>
          </div>
        </article>
      </div>

      <div class="dash-charts">
        <div class="dash-glass dash-glass--chart">
          <div class="dash-glass-head">
            <div>
              <h3 class="dash-h3">区域房源分布</h3>
              <p class="dash-h3-sub">环形占比 · 共 {{ regionTotal }} 套</p>
            </div>
          </div>
          <div v-show="hasRegionChartData" ref="pieEl" class="dash-chart dash-chart--pie" />
          <p v-if="!hasRegionChartData" class="dash-chart-empty">暂无区域分布数据，请先在房源中填写所属区域。</p>
        </div>

        <div class="dash-glass dash-glass--chart">
          <div class="dash-glass-head">
            <div>
              <h3 class="dash-h3">区域排名</h3>
              <p class="dash-h3-sub">横向对比各区域房源量</p>
            </div>
          </div>
          <div v-show="hasRegionChartData" ref="barEl" class="dash-chart dash-chart--bar" />
          <p v-if="!hasRegionChartData" class="dash-chart-empty">暂无区域排名数据。</p>
        </div>

        <div class="dash-glass dash-glass--table">
          <div class="dash-glass-head">
            <div>
              <h3 class="dash-h3">员工跟进活跃</h3>
              <p class="dash-h3-sub">近 7 日跟进、带看与成交</p>
            </div>
          </div>
          <div class="dash-table-wrap">
            <table class="dash-table">
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
                  <td>
                    <span class="dash-staff-name">{{ r.name }}</span>
                  </td>
                  <td>{{ r.followUps }}</td>
                  <td>{{ r.viewings }}</td>
                  <td>
                    <span class="dash-deal-pill" :class="{ 'dash-deal-pill--on': r.deals > 0 }">{{ r.deals }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="staffActivity.length === 0" class="dash-empty">暂无员工活跃数据。</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard-page {
  position: relative;
  width: 100%;
  min-height: 100%;
  overflow: hidden;
}

.dash-atmosphere {
  position: absolute;
  inset: -40px -24px 0;
  pointer-events: none;
  z-index: 0;
}

.dash-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.45;
}

.dash-blob--a {
  width: 320px;
  height: 320px;
  top: -80px;
  right: 8%;
  background: radial-gradient(circle, rgba(74, 111, 168, 0.35), transparent 70%);
}

.dash-blob--b {
  width: 280px;
  height: 280px;
  left: -60px;
  top: 120px;
  background: radial-gradient(circle, rgba(94, 234, 212, 0.22), transparent 70%);
}

.dash-blob--c {
  width: 240px;
  height: 240px;
  right: 30%;
  bottom: -40px;
  background: radial-gradient(circle, rgba(26, 58, 108, 0.18), transparent 70%);
}

.dash-header,
.dash-status,
.dash-body {
  position: relative;
  z-index: 1;
}

.dash-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.dash-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.dash-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
}

.dash-live-tag {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #0d9488;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(94, 234, 212, 0.35);
  box-shadow: 0 4px 16px rgba(13, 148, 136, 0.12);
}

.dash-status {
  padding: 12px 0;
  font-size: 13px;
  color: #64748b;
}

.dash-status--err {
  color: var(--rose, #e11d48);
}

.dash-kpis {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 1100px) {
  .dash-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-kpi-glass {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 20px 18px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(18px) saturate(1.35);
  -webkit-backdrop-filter: blur(18px) saturate(1.35);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 10px 40px rgba(26, 58, 108, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(255, 255, 255, 0.25);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.dash-kpi-glass:hover {
  transform: translateY(-3px);
  box-shadow:
    0 16px 48px rgba(26, 58, 108, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.dash-kpi-glass__shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, transparent 42%, transparent 100%);
  pointer-events: none;
}

.dash-kpi-glass--navy {
  box-shadow:
    0 10px 40px rgba(26, 58, 108, 0.1),
    0 0 0 1px rgba(26, 58, 108, 0.06) inset;
}
.dash-kpi-glass--teal {
  box-shadow:
    0 10px 40px rgba(13, 148, 136, 0.1),
    0 0 0 1px rgba(94, 234, 212, 0.12) inset;
}
.dash-kpi-glass--sky {
  box-shadow:
    0 10px 40px rgba(56, 189, 248, 0.1),
    0 0 0 1px rgba(56, 189, 248, 0.1) inset;
}
.dash-kpi-glass--gold {
  box-shadow:
    0 10px 40px rgba(217, 119, 6, 0.1),
    0 0 0 1px rgba(251, 191, 36, 0.15) inset;
}

.dash-kpi-glass__icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.dash-kpi-glass__icon svg {
  width: 22px;
  height: 22px;
}

.dash-kpi-icon--prop {
  color: #1a3a6c;
  background: linear-gradient(145deg, rgba(74, 111, 168, 0.2), rgba(255, 255, 255, 0.5));
}
.dash-kpi-icon--vacant {
  color: #0d9488;
  background: linear-gradient(145deg, rgba(94, 234, 212, 0.25), rgba(255, 255, 255, 0.5));
}
.dash-kpi-icon--cust {
  color: #0284c7;
  background: linear-gradient(145deg, rgba(56, 189, 248, 0.22), rgba(255, 255, 255, 0.5));
}
.dash-kpi-icon--deal {
  color: #b45309;
  background: linear-gradient(145deg, rgba(251, 191, 36, 0.28), rgba(255, 255, 255, 0.5));
}

.dash-kpi-glass__text {
  min-width: 0;
  flex: 1;
}

.dash-kpi-label {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
}

.dash-kpi-value {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.15;
}

.dash-kpi-trend {
  margin: 6px 0 0;
  font-size: 11px;
  color: #0d9488;
}

.dash-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 16px;
}

.dash-glass--table {
  grid-column: 1 / -1;
}

@media (max-width: 1024px) {
  .dash-charts {
    grid-template-columns: 1fr;
  }
  .dash-glass--table {
    grid-column: 1;
  }
}

.dash-glass {
  border-radius: 18px;
  padding: 18px 20px 20px;
  min-width: 0;
  background: rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(16px) saturate(1.25);
  -webkit-backdrop-filter: blur(16px) saturate(1.25);
  border: 1px solid rgba(255, 255, 255, 0.68);
  box-shadow:
    0 8px 32px rgba(26, 58, 108, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.dash-glass-head {
  margin-bottom: 8px;
}

.dash-h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.dash-h3-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.dash-chart {
  width: 100%;
}

.dash-chart--pie {
  height: 280px;
}

.dash-chart--bar {
  height: 280px;
}

.dash-chart-empty {
  margin: 24px 0 8px;
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35);
}

.dash-table-wrap {
  overflow: auto;
  margin-top: 4px;
}

.dash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.dash-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.dash-table tbody td {
  padding: 12px;
  color: #334155;
  border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

.dash-table tbody tr {
  transition: background 0.15s ease;
}

.dash-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.45);
}

.dash-staff-name {
  font-weight: 600;
  color: #0f172a;
}

.dash-deal-pill {
  display: inline-flex;
  min-width: 28px;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.dash-deal-pill--on {
  background: rgba(94, 234, 212, 0.25);
  color: #0f766e;
}

.dash-empty {
  margin: 12px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

@media (prefers-reduced-motion: reduce) {
  .dash-kpi-glass {
    transition: none;
  }
  .dash-kpi-glass:hover {
    transform: none;
  }
}
</style>
