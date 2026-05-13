<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchLogs } from '@/api/admin'
import type { LogAction, LogKind, LogRow } from '@/types/domain'

const list = ref<LogRow[]>([])
const obj = ref<LogKind | 'all'>('all')
const act = ref<LogAction | 'all'>('all')
const kw = ref('')

onMounted(async () => {
  const { list: rows } = await fetchLogs()
  list.value = rows
})

const filtered = computed(() => {
  return list.value.filter((row) => {
    const badObj = obj.value !== 'all' && row.kind !== obj.value
    const badAct = act.value !== 'all' && row.action !== act.value
    const blob = `${row.time} ${row.actor} ${row.objectLabel} ${row.actionLabel} ${row.detail}`.toLowerCase()
    const q = kw.value.trim().toLowerCase()
    const badKw = q.length > 0 && !blob.includes(q)
    return !(badObj || badAct || badKw)
  })
})

function filter() {
  /* reactive computed already updates */
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar" style="flex-wrap: wrap; gap: 10px">
      <select v-model="obj">
        <option value="all">对象：全部</option>
        <option value="prop">房源</option>
        <option value="cust">客户</option>
        <option value="acct">账号</option>
      </select>
      <select v-model="act">
        <option value="all">动作：全部</option>
        <option value="login">登录</option>
        <option value="view">查看</option>
        <option value="edit">编辑</option>
        <option value="share">转发</option>
        <option value="export">导出尝试</option>
      </select>
      <input type="date" />
      —
      <input type="date" />
      <input v-model="kw" type="search" placeholder="房源编号 / 客户名 / 操作者…" style="min-width: 220px" />
      <button type="button" class="btn btn-primary" @click="filter">筛选</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作者</th>
            <th>对象</th>
            <th>动作</th>
            <th>详情 / 证据</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in filtered" :key="i">
            <td>{{ r.time }}</td>
            <td>{{ r.actor }}</td>
            <td>{{ r.objectLabel }}</td>
            <td>{{ r.actionLabel }}</td>
            <td>{{ r.detail }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" style="margin-top: 12px; padding: 0 4px">
      筛选为前端演示：按对象类型 + 关键词匹配整行文本；正式版走服务端分页与字段级 diff。
    </p>
  </section>
</template>
