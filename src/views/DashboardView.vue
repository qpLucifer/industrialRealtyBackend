<script setup lang="ts">
import * as echarts from 'echarts/core'
import { graphic } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchDashboard } from '@/api/admin'
import type {
  DashboardAttentionItem,
  DashboardPipelineItem,
  DashboardPlatformItem,
  KpiItem,
  RegionBar,
  StaffActivityRow,
} from '@/types/domain'

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

const kpis = ref<KpiItem[]>([])
const regionBars = ref<RegionBar[]>([])
const staffActivity = ref<StaffActivityRow[]>([])
const pipeline = ref<DashboardPipelineItem[]>([])
const attention = ref<DashboardAttentionItem[]>([])
const platform = ref<DashboardPlatformItem[]>([])
const loading = ref(false)
const loadError = ref('')

const pipelineEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)
let pipelineChart: ReturnType<typeof echarts.init> | null = null
let barChart: ReturnType<typeof echarts.init> | null = null
let roPipeline: ResizeObserver | null = null
let roBar: ResizeObserver | null = null

const chartPalette = ['#10b981', '#f59e0b', '#64748b', '#f43f5e', '#1a3a6c', '#38bdf8']
const pipelineColors: Record<string, string> = {
  live: '#10b981',
  pending: '#f59e0b',
  draft: '#64748b',
  rejected: '#f43f5e',
}

const attentionRoutes: Record<string, string> = {
  audit: '/app/audit',
  draft: '/app/properties',
  rejected: '/app/audit',
  viewings: '/app/viewings',
}

type DashboardModuleLink = {
  to: string
  title: string
  desc: string
  tag?: string
  tone: string
}

const moduleLinks: DashboardModuleLink[] = [
  {
    to: '/app/properties',
    title: '房源管理',
    desc: '全字段维护 · 上下架 · 主推',
    tag: '核心',
    tone: 'navy',
  },
  {
    to: '/app/audit',
    title: '审核中心',
    desc: '待审队列 · 通过 / 驳回',
    tag: '待办',
    tone: 'amber',
  },
  {
    to: '/app/property-privacy',
    title: '房源隐私',
    desc: '隐私查看 · 小程序编辑授权',
    tag: '权限',
    tone: 'violet',
  },
  {
    to: '/app/customers',
    title: '客户统筹',
    desc: 'ABC 分级 · 跟进 · 公私有池',
    tone: 'teal',
  },
  {
    to: '/app/viewings',
    title: '带看 / 成交',
    desc: '带看台账 · 成交备案',
    tone: 'sky',
  },
  {
    to: '/app/land-auction',
    title: '工业土地',
    desc: '挂拍预告 · 在拍 · 成交统计',
    tone: 'gold',
  },
  {
    to: '/app/video-faq',
    title: '视频 FAQ',
    desc: '短视频库 · 小程序可搜',
    tone: 'rose',
  },
  {
    to: '/app/staff',
    title: '组织与安全',
    desc: '员工 · 白名单 · 区域 · 板块',
    tone: 'slate',
  },
]

const todayLabel = computed(() => {
  const d = new Date()
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${w}`
})

const regionTotal = computed(() => regionBars.value.reduce((s, b) => s + regionCount(b), 0))
const pipelineTotal = computed(() => pipeline.value.reduce((s, p) => s + (p.count || 0), 0))
const hasRegionChartData = computed(() => regionTotal.value > 0)
const hasPipelineData = computed(() => pipelineTotal.value > 0)
const topStaff = computed(() => staffActivity.value.slice(0, 8))

function regionCount(b: RegionBar) {
  const n = Number(b.count)
  if (Number.isFinite(n) && n >= 0) return n
  const pct = Number(b.heightPct)
  if (!Number.isFinite(pct) || pct <= 0) return 0
  const max = Math.max(...regionBars.value.map((x) => Number(x.count) || 0), 1)
  return Math.round((pct / 100) * max)
}

function sortedRegions(source: RegionBar[]) {
  return [...source].sort((a, b) => regionCount(b) - regionCount(a))
}

function attentionRoute(key: string) {
  return attentionRoutes[key] || '/app/dashboard'
}

function disposeCharts() {
  roPipeline?.disconnect()
  roBar?.disconnect()
  roPipeline = null
  roBar = null
  pipelineChart?.dispose()
  barChart?.dispose()
  pipelineChart = null
  barChart = null
}

function renderPipelineChart(items: DashboardPipelineItem[]) {
  if (!pipelineEl.value) return
  pipelineChart?.dispose()
  pipelineChart = echarts.init(pipelineEl.value, undefined, { renderer: 'canvas' })

  const data = items
    .filter((p) => p.count > 0)
    .map((p) => ({
      name: p.label,
      value: p.count,
      itemStyle: { color: pipelineColors[p.key] || chartPalette[0] },
    }))

  pipelineChart.setOption(
    {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15,23,42,0.92)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontSize: 12 },
        formatter: (p: { name?: string; value?: number; percent?: number }) =>
          `${p.name ?? ''}<br/>${p.value ?? 0} 套 · ${p.percent ?? 0}%`,
      },
      legend: {
        bottom: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['50%', '44%'],
          itemStyle: {
            borderRadius: 10,
            borderColor: 'rgba(255,255,255,0.9)',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { show: true, fontWeight: 700, formatter: '{b}\n{c}' },
          },
          data,
          animationDuration: 680,
        },
      ],
    },
    { notMerge: true },
  )
  pipelineChart.resize()
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
                { offset: 1, color: `${chartPalette[i % chartPalette.length]}88` },
              ]),
              borderRadius: [0, 8, 8, 0],
            },
          })),
          barWidth: '52%',
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            color: '#64748b',
          },
          animationDuration: 620,
        },
      ],
    },
    { notMerge: true },
  )
  barChart.resize()
}

function renderAllCharts() {
  if (loading.value) return
  renderPipelineChart(pipeline.value)
  renderBarChart(regionBars.value)
}

function scheduleChartPaint() {
  void nextTick().then(() => {
    requestAnimationFrame(() => {
      renderAllCharts()
      pipelineChart?.resize()
      barChart?.resize()
    })
  })
}

watch([regionBars, pipeline], () => scheduleChartPaint(), { deep: true })
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
    pipeline.value = Array.isArray(data.pipeline) ? data.pipeline : []
    attention.value = Array.isArray(data.attention) ? data.attention : []
    platform.value = Array.isArray(data.platform) ? data.platform : []
  } catch {
    loadError.value = '加载失败'
  } finally {
    loading.value = false
  }
  scheduleChartPaint()
}

function bindResize() {
  roPipeline?.disconnect()
  roBar?.disconnect()
  if (pipelineEl.value && typeof ResizeObserver !== 'undefined') {
    roPipeline = new ResizeObserver(() => pipelineChart?.resize())
    roPipeline.observe(pipelineEl.value)
  }
  if (barEl.value && typeof ResizeObserver !== 'undefined') {
    roBar = new ResizeObserver(() => barChart?.resize())
    roBar.observe(barEl.value)
  }
}

function onWinResize() {
  pipelineChart?.resize()
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
  <section class="dash">
    <header class="dash-hero">
      <div class="dash-hero__mesh" aria-hidden="true" />
      <div class="dash-hero__inner">
        <div class="dash-hero__copy">
          <p class="dash-hero__eyebrow">Operations Command</p>
          <h2 class="dash-hero__title">运营驾驶舱</h2>
          <p class="dash-hero__sub">
            房源审核漏斗 · 小程序生态 · 带看成交 · 土地与内容模块一屏总览
          </p>
          <p class="dash-hero__date">{{ todayLabel }}</p>
        </div>
        <div class="dash-hero__actions">
          <span v-if="!loading && !loadError" class="dash-live-pill">
            <span class="dash-live-pill__dot" />
            实时统计
          </span>
          <button type="button" class="dash-refresh-btn" :disabled="loading" @click="loadDashboard">
            {{ loading ? '刷新中…' : '刷新数据' }}
          </button>
        </div>
      </div>
    </header>

    <p v-if="loading" class="dash-status">加载中…</p>
    <p v-else-if="loadError" class="dash-status dash-status--err">
      {{ loadError }}
      <button type="button" class="btn" @click="loadDashboard">重试</button>
    </p>

    <div v-else class="dash-body">
      <div class="dash-kpi-grid">
        <article v-for="(k, i) in kpis" :key="k.label" class="dash-kpi" :class="`dash-kpi--${i}`">
          <p class="dash-kpi__label">{{ k.label }}</p>
          <p class="dash-kpi__value">{{ k.value }}</p>
          <p v-if="k.trend" class="dash-kpi__trend">{{ k.trend }}</p>
        </article>
      </div>

      <div class="dash-attention">
        <RouterLink
          v-for="item in attention"
          :key="item.key"
          :to="attentionRoute(item.key)"
          class="dash-attention__card"
        >
          <span class="dash-attention__value">{{ item.value }}</span>
          <span class="dash-attention__label">{{ item.label }}</span>
          <span v-if="item.hint" class="dash-attention__hint">{{ item.hint }} →</span>
        </RouterLink>
      </div>

      <div class="dash-main-grid">
        <div class="dash-panel">
          <div class="dash-panel__head">
            <div>
              <h3 class="dash-panel__title">房源审核漏斗</h3>
              <p class="dash-panel__sub">草稿 → 待审 → 上架 / 驳回 · 共 {{ pipelineTotal }} 套</p>
            </div>
          </div>
          <div v-show="hasPipelineData" ref="pipelineEl" class="dash-chart dash-chart--pipeline" />
          <ul v-if="hasPipelineData" class="dash-pipeline-legend">
            <li v-for="p in pipeline" :key="p.key">
              <span class="dash-pipeline-legend__dot" :style="{ background: pipelineColors[p.key] }" />
              {{ p.label }}
              <strong>{{ p.count }}</strong>
            </li>
          </ul>
          <p v-else class="dash-empty">暂无房源漏斗数据</p>
        </div>

        <div class="dash-panel">
          <div class="dash-panel__head">
            <div>
              <h3 class="dash-panel__title">区域房源分布</h3>
              <p class="dash-panel__sub">按所属区域统计 · 共 {{ regionTotal }} 套</p>
            </div>
          </div>
          <div v-show="hasRegionChartData" ref="barEl" class="dash-chart dash-chart--bar" />
          <p v-else class="dash-empty">暂无区域分布，请完善房源所属区域。</p>
        </div>
      </div>

      <section class="dash-section">
        <div class="dash-section__head">
          <h3 class="dash-section__title">业务模块</h3>
          <p class="dash-section__sub">覆盖当前版本全部核心能力，一键进入管理页</p>
        </div>
        <div class="dash-modules">
          <RouterLink
            v-for="m in moduleLinks"
            :key="m.to"
            :to="m.to"
            class="dash-module"
            :class="m.tone ? `dash-module--${m.tone}` : ''"
          >
            <div class="dash-module__top">
              <span class="dash-module__title">{{ m.title }}</span>
              <span v-if="m.tag" class="dash-module__tag">{{ m.tag }}</span>
            </div>
            <p class="dash-module__desc">{{ m.desc }}</p>
          </RouterLink>
        </div>
      </section>

      <section class="dash-section">
        <div class="dash-section__head">
          <h3 class="dash-section__title">小程序生态</h3>
          <p class="dash-section__sub">组织准入 · 隐私授权 · 内容与客户触达</p>
        </div>
        <div class="dash-platform">
          <div v-for="p in platform" :key="p.key" class="dash-platform__item">
            <span class="dash-platform__value">{{ p.value }}</span>
            <span class="dash-platform__label">{{ p.label }}</span>
          </div>
        </div>
      </section>

      <section class="dash-panel dash-panel--table">
        <div class="dash-panel__head">
          <div>
            <h3 class="dash-panel__title">团队活跃榜</h3>
            <p class="dash-panel__sub">近 7 日跟进 · 带看 · 成交（Top 8）</p>
          </div>
        </div>
        <div class="dash-table-wrap">
          <table class="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>员工</th>
                <th>跟进</th>
                <th>带看</th>
                <th>成交</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, idx) in topStaff" :key="r.name">
                <td><span class="dash-rank" :class="{ 'dash-rank--top': idx < 3 }">{{ idx + 1 }}</span></td>
                <td><span class="dash-staff-name">{{ r.name }}</span></td>
                <td>{{ r.followUps }}</td>
                <td>{{ r.viewings }}</td>
                <td>
                  <span class="dash-deal-pill" :class="{ 'dash-deal-pill--on': r.deals > 0 }">{{ r.deals }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="topStaff.length === 0" class="dash-empty">暂无员工活跃数据。</p>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dash {
  position: relative;
  min-height: 100%;
}

.dash-hero {
  position: relative;
  margin: -4px -4px 22px;
  padding: 28px 28px 26px;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1a3a6c 52%, #0f766e 100%);
  color: #f8fafc;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
}

.dash-hero__mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 20%, rgba(94, 234, 212, 0.22), transparent 42%),
    radial-gradient(circle at 88% 10%, rgba(56, 189, 248, 0.18), transparent 36%),
    radial-gradient(circle at 70% 90%, rgba(255, 255, 255, 0.08), transparent 40%);
  pointer-events: none;
}

.dash-hero__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.dash-hero__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.62);
}

.dash-hero__title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.dash-hero__sub {
  margin: 10px 0 0;
  max-width: 560px;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(248, 250, 252, 0.78);
}

.dash-hero__date {
  margin: 12px 0 0;
  font-size: 12px;
  color: rgba(248, 250, 252, 0.55);
}

.dash-hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dash-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.dash-live-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.22);
  animation: dash-pulse 2s ease-in-out infinite;
}

@keyframes dash-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}

.dash-refresh-btn {
  padding: 9px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease;
}

.dash-refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.dash-refresh-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.dash-status {
  padding: 12px 0;
  font-size: 13px;
  color: #64748b;
}

.dash-status--err {
  color: var(--rose, #e11d48);
}

.dash-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dash-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

@media (max-width: 1100px) {
  .dash-kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-kpi {
  padding: 18px 18px 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
}

.dash-kpi--0 {
  border-top: 3px solid #1a3a6c;
}
.dash-kpi--1 {
  border-top: 3px solid #0d9488;
}
.dash-kpi--2 {
  border-top: 3px solid #0284c7;
}
.dash-kpi--3 {
  border-top: 3px solid #d97706;
}

.dash-kpi__label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.dash-kpi__value {
  margin: 8px 0 0;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
  line-height: 1.1;
}

.dash-kpi__trend {
  margin: 8px 0 0;
  font-size: 11px;
  color: #0d9488;
}

.dash-attention {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 960px) {
  .dash-attention {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-attention__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 16px;
  text-decoration: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  border: 1px solid rgba(15, 23, 42, 0.07);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.dash-attention__card:hover {
  transform: translateY(-2px);
  border-color: rgba(26, 58, 108, 0.14);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.dash-attention__value {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.dash-attention__label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.dash-attention__hint {
  margin-top: 4px;
  font-size: 11px;
  color: #0d9488;
  font-weight: 600;
}

.dash-main-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 14px;
}

@media (max-width: 1024px) {
  .dash-main-grid {
    grid-template-columns: 1fr;
  }
}

.dash-panel {
  padding: 18px 20px 20px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  min-width: 0;
}

.dash-panel--table {
  margin-top: 0;
}

.dash-panel__head {
  margin-bottom: 8px;
}

.dash-panel__title,
.dash-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.dash-panel__sub,
.dash-section__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.dash-section__head {
  margin-bottom: 12px;
}

.dash-chart {
  width: 100%;
}

.dash-chart--pipeline {
  height: 260px;
}

.dash-chart--bar {
  height: 300px;
}

.dash-pipeline-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
}

.dash-pipeline-legend li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.dash-pipeline-legend strong {
  color: #0f172a;
  font-weight: 700;
}

.dash-pipeline-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dash-modules {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) {
  .dash-modules {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-module {
  display: block;
  padding: 16px 16px 14px;
  border-radius: 16px;
  text-decoration: none;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.dash-module:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.dash-module__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dash-module__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.dash-module__tag {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.dash-module__desc {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.dash-module--navy {
  border-top: 3px solid #1a3a6c;
}
.dash-module--amber {
  border-top: 3px solid #f59e0b;
}
.dash-module--violet {
  border-top: 3px solid #7c3aed;
}
.dash-module--teal {
  border-top: 3px solid #0d9488;
}
.dash-module--sky {
  border-top: 3px solid #0284c7;
}
.dash-module--gold {
  border-top: 3px solid #d97706;
}
.dash-module--rose {
  border-top: 3px solid #e11d48;
}
.dash-module--slate {
  border-top: 3px solid #64748b;
}

.dash-platform {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 960px) {
  .dash-platform {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dash-platform__item {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff, #f8fafc);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.dash-platform__value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.dash-platform__label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
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

.dash-table tbody tr:hover {
  background: rgba(248, 250, 252, 0.9);
}

.dash-rank {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
}

.dash-rank--top {
  color: #0f766e;
  background: rgba(94, 234, 212, 0.22);
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
  margin: 20px 0 8px;
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  border-radius: 12px;
  background: #f8fafc;
}

@media (prefers-reduced-motion: reduce) {
  .dash-live-pill__dot {
    animation: none;
  }
  .dash-attention__card,
  .dash-module {
    transition: none;
  }
}
</style>
