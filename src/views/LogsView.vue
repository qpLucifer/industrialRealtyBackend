<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchLogs } from '@/api/admin'
import type { LogAction, LogKind, LogRow } from '@/types/domain'

const list = ref<LogRow[]>([])
const obj = ref<LogKind | 'all'>('all')
const act = ref<LogAction | 'all'>('all')
const kw = ref('')
const dateFrom = ref('')
const dateTo = ref('')

async function load() {
  const kind = obj.value === 'all' ? undefined : obj.value
  const action = act.value === 'all' ? undefined : act.value
  const q = kw.value.trim() || undefined
  const df = dateFrom.value || undefined
  const dt = dateTo.value || undefined
  const { list: rows } = await fetchLogs({ kind, action, q, dateFrom: df, dateTo: dt })
  list.value = rows
}

function filter() {
  load().catch(() => ElMessage.error('加载失败'))
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
