<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchLogs, fetchLogsCount, purgeLogs } from '@/api/admin'
import type { LogAction, LogKind, LogRow } from '@/types/domain'

const list = ref<LogRow[]>([])
const obj = ref<LogKind | 'all'>('all')
const act = ref<LogAction | 'all'>('all')
const kw = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const retentionDays = ref(90)

function filterParams() {
  const kind = obj.value === 'all' ? undefined : obj.value
  const action = act.value === 'all' ? undefined : act.value
  const q = kw.value.trim() || undefined
  const df = dateFrom.value || undefined
  const dt = dateTo.value || undefined
  return { kind, action, q, dateFrom: df, dateTo: dt }
}

function hasSqlNarrowFilter() {
  return obj.value !== 'all' || act.value !== 'all' || Boolean(dateFrom.value?.trim()) || Boolean(dateTo.value?.trim())
}

async function load() {
  const { kind, action, q, dateFrom: df, dateTo: dt } = filterParams()
  const { list: rows } = await fetchLogs({ kind, action, q, dateFrom: df, dateTo: dt })
  list.value = rows
}

function filter() {
  load().catch(() => {
    /* global http interceptor shows API error */
  })
}

async function onPurgeByFilters() {
  if (!hasSqlNarrowFilter()) {
    ElMessage.warning('请至少选择对象类型、动作之一，或填写记录时间起止，再使用「按筛选删除」')
    return
  }
  const { kind, action, dateFrom: df, dateTo: dt } = filterParams()
  try {
    const { count } = await fetchLogsCount({ kind, action, dateFrom: df, dateTo: dt })
    await ElMessageBox.confirm(
      `将永久删除符合当前「对象 / 动作 / 记录时间」条件的日志共 ${count} 条（不含顶部关键词筛选）。是否继续？`,
      '删除日志',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    const { kind, action, dateFrom: df, dateTo: dt } = filterParams()
    const { deleted, matchedBefore } = await purgeLogs({ kind, action, dateFrom: df, dateTo: dt })
    ElMessage.success(`已删除 ${deleted} 条（匹配 ${matchedBefore} 条）`)
    await load()
  } catch {
    /* global http interceptor shows API error */
  }
}

async function onPurgeOlderThan() {
  const n = Math.min(3650, Math.max(1, Math.floor(Number(retentionDays.value) || 0)))
  if (!Number.isFinite(n) || n < 1) {
    ElMessage.warning('请输入 1～3650 之间的天数')
    return
  }
  try {
    const { count } = await fetchLogsCount({ olderThanDays: n })
    await ElMessageBox.confirm(
      `将永久删除记录时间早于「当前时间减去 ${n} 天」的日志共 ${count} 条（忽略对象/动作/关键词筛选）。是否继续？`,
      '按保留期删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    const n2 = Math.min(3650, Math.max(1, Math.floor(Number(retentionDays.value) || 0)))
    const { deleted } = await purgeLogs({ olderThanDays: n2 })
    ElMessage.success(`已删除 ${deleted} 条`)
    await load()
  } catch {
    /* global http interceptor shows API error */
  }
}

onMounted(() => {
  filter()
})
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px">
      <select v-model="obj" @change="filter">
        <option value="all">对象：全部</option>
        <option value="prop">房源</option>
        <option value="cust">客户</option>
        <option value="acct">账号</option>
      </select>
      <select v-model="act" @change="filter">
        <option value="all">动作：全部</option>
        <option value="login">登录</option>
        <option value="view">查看</option>
        <option value="edit">编辑</option>
        <option value="share">转发</option>
        <option value="export">导出尝试</option>
      </select>
      <div class="full" style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px">
        <span class="hint" style="margin: 0">记录时间</span>
        <el-date-picker
          v-model="dateFrom"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="开始"
          style="width: 200px"
          clearable
          @change="filter"
        />
        <span class="hint">至</span>
        <el-date-picker
          v-model="dateTo"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="结束"
          style="width: 200px"
          clearable
          @change="filter"
        />
      </div>
      <input v-model="kw" type="search" placeholder="房源编号 / 客户名 / 操作者…" style="min-width: 220px" @keyup.enter="filter" />
      <button type="button" class="btn btn-primary" @click="filter">筛选</button>
    </div>
    <div class="card" style="margin-top: 12px; padding: 14px 16px">
      <h3 style="margin: 0 0 10px; font-size: 15px">日志清理</h3>
      <p class="hint" style="margin: 0 0 12px">
        用于控制 <code>audit_logs</code> 表体积。删除不可恢复；「按筛选删除」不含关键词条件（与列表顶部关键词仅前端过滤一致）。须先收窄对象/动作/时间再执行按条件删除。
      </p>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center">
        <button type="button" class="btn" style="border-color: var(--rose); color: var(--rose)" @click="onPurgeByFilters">
          按当前对象/动作/时间删除
        </button>
        <span class="hint">删除早于</span>
        <input
          v-model.number="retentionDays"
          type="number"
          min="1"
          max="3650"
          style="width: 72px"
        />
        <span class="hint">天的全部日志</span>
        <button type="button" class="btn" style="border-color: var(--rose); color: var(--rose)" @click="onPurgeOlderThan">执行保留期清理</button>
      </div>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>记录时间</th>
            <th>展示时间</th>
            <th>操作者</th>
            <th>对象</th>
            <th>动作</th>
            <th>详情 / 证据</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id ?? r.time + r.detail">
            <td>{{ r.id ?? '—' }}</td>
            <td>{{ r.loggedAt ?? '—' }}</td>
            <td>{{ r.time }}</td>
            <td>{{ r.actor }}</td>
            <td>{{ r.objectLabel }}</td>
            <td>{{ r.actionLabel }}</td>
            <td>{{ r.detail }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" style="margin-top: 12px; padding: 0 4px">对象、动作与日期区间由服务端 SQL 过滤；关键词在后端对结果集再匹配（最多 500 条）。执行 <code>npm run db:reset</code> 后含 <code>logged_at</code> 列。</p>
  </section>
</template>
