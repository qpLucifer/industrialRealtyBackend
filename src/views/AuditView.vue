<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { auditPassApi, auditRejectApi, fetchAuditQueue } from '@/api/admin'
import type { AuditQueueRow } from '@/types/domain'

const list = ref<AuditQueueRow[]>([])

onMounted(async () => {
  const { list: rows } = await fetchAuditQueue()
  list.value = rows
})

async function onPass(row: AuditQueueRow) {
  await auditPassApi({ code: row.code })
  ElMessage.success('已通过审核 · 房源对内可见')
}

async function onReject(row: AuditQueueRow) {
  await auditRejectApi({ code: row.code })
  ElMessage.success('已驳回 · 通知提交人修改')
}
</script>

<template>
  <section class="panel active">
    <div class="card">
      <h3>待审核队列</h3>
      <table class="data" style="margin-top: 12px">
        <thead>
          <tr>
            <th>房源编号</th>
            <th>标题</th>
            <th>提交人</th>
            <th>时间</th>
            <th>风险标签</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.code">
            <td>{{ r.code }}</td>
            <td>{{ r.title }}</td>
            <td>{{ r.submitter }}</td>
            <td>{{ r.submittedAt }}</td>
            <td><span class="tag cyan">{{ r.riskTag }}</span></td>
            <td>
              <button type="button" class="btn btn-primary" style="padding: 6px 12px" @click="onPass(r)">通过</button>
              <button type="button" class="btn" style="padding: 6px 12px" @click="onReject(r)">驳回</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="hint" style="margin-top: 14px">可与风控规则联动：低价异常、图片重复、联系人黑名单。</p>
    </div>
  </section>
</template>
