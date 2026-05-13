<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchWhitelist } from '@/api/admin'
import type { WhitelistRow } from '@/types/domain'

const list = ref<WhitelistRow[]>([])

onMounted(async () => {
  const { list: rows } = await fetchWhitelist()
  list.value = rows
})
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary">导入白名单</button>
      <button type="button" class="btn">下载模板</button>
      <button type="button" class="btn">同步 HR（预留）</button>
    </div>
    <div class="card">
      <h3>准入号码池（与小程序联动）</h3>
      <table class="data" style="margin-top: 12px">
        <thead>
          <tr>
            <th>手机号</th>
            <th>姓名</th>
            <th>备注</th>
            <th>更新人</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in list" :key="i">
            <td>{{ r.phone }}</td>
            <td>{{ r.name }}</td>
            <td>{{ r.remark }}</td>
            <td>{{ r.updatedBy }}</td>
            <td>{{ r.updatedAt }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
