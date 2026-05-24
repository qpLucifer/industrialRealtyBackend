<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auditPassApi, auditRejectApi, fetchAuditQueue } from '@/api/admin'
import type { AuditQueueRow } from '@/types/domain'
import { formatBeijingDisplay } from '@/lib/beijingTime'
import PropertyFullModal from '@/components/PropertyFullModal.vue'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { CircleCheck, CloseBold, View } from '@element-plus/icons-vue'

const list = ref<AuditQueueRow[]>([])
const { listPage, listPageSize, listTotal, applyPagedResult, listQueryParams } = useAdminListPagination()
const modalVisible = ref(false)
const modalCode = ref('')
const loading = ref(false)
const loadError = ref('')

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const result = await fetchAuditQueue(listQueryParams())
    list.value = result.list
    applyPagedResult(result)
  } catch {
    loadError.value = '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openDetail(row: AuditQueueRow) {
  modalCode.value = row.code
  modalVisible.value = true
}

async function onPass(row: AuditQueueRow) {
  try {
    await auditPassApi({ code: row.code })
    ElMessage.success('已通过审核')
    await load()
  } catch {
    /* global http interceptor */
  }
}

async function onReject(row: AuditQueueRow) {
  try {
    const { value } = await ElMessageBox.prompt('请填写驳回原因（至少 2 个字，将写入房源备注）', `驳回 · ${row.code}`, {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '例如：现场照片不清晰，请补充产权证扫描件。',
      inputValidator: (v) => {
        const t = String(v || '').trim()
        if (t.length < 2) return '驳回原因至少 2 个字符'
        if (t.length > 500) return '驳回原因不超过 500 字'
        return true
      },
    })
    const reason = String(value || '').trim()
    await auditRejectApi({ code: row.code, reason })
    ElMessage.success('已驳回')
    await load()
  } catch {
    /* cancelled */
  }
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn" @click="load">刷新队列</button>
      <span v-if="loading" class="hint">加载中…</span>
      <span v-else-if="loadError" class="hint" style="color: var(--rose)">{{ loadError }}</span>
    </div>
    <div class="card">
      <h3>待审核队列</h3>
      <div class="audit-table-wrap">
        <table class="data audit-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>标题</th>
              <th>区域</th>
              <th>类型</th>
              <th>提交人</th>
              <th>提交时间</th>
              <!-- <th>列表行 1 / 2</th> -->
              <th>摘要行</th>
              <th>规格 / 价格</th>
              <th>审核提示</th>
              <th>风险标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in list" :key="r.code">
              <td>{{ r.code }}</td>
              <td class="cell-wrap">{{ r.detailTitle || r.title }}</td>
              <td>{{ r.district || '—' }}</td>
              <td>{{ r.type || '—' }}</td>
              <td>{{ r.submitter }}</td>
              <td class="nowrap">{{ formatBeijingDisplay(r.submittedAt) || r.submittedAt || '—' }}</td>
              <!-- <td class="cell-wrap hint-sm">
                <div>{{ r.listingLine1 || '—' }}</div>
                <div>{{ r.listingLine2 || '—' }}</div>
              </td> -->
              <td class="cell-wrap hint-sm">{{ r.metaLine || '—' }}</td>
              <td class="cell-wrap hint-sm">
                <div>{{ r.specLine || '—' }}</div>
                <div>{{ r.priceLine || '—' }}</div>
              </td>
              <td class="cell-wrap hint-sm">{{ r.auditHint || '—' }}</td>
              <td><span class="tag cyan">{{ r.riskTag || '—' }}</span></td>
              <td class="table-actions">
                <TableActionBtn title="详情" :icon="View" @click="openDetail(r)" />
                <TableActionBtn title="通过" :icon="CircleCheck" variant="success" @click="onPass(r)" />
                <TableActionBtn title="驳回" :icon="CloseBold" variant="warning" @click="onReject(r)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AdminListPagination
        v-model:page="listPage"
        v-model:page-size="listPageSize"
        :total="listTotal"
        @change="load"
      />
      <p v-if="list.length === 0" class="hint" style="margin-top: 14px">当前无待审核项。</p>
      <p v-else class="hint" style="margin-top: 14px">请先点「详情」核对完整资料（与房源编辑表单字段一致），再执行通过或驳回。</p>
    </div>

    <PropertyFullModal v-model:visible="modalVisible" :code="modalCode" mode="view" />
  </section>
</template>

<style scoped>
.audit-hint {
  margin-top: 10px;
  line-height: 1.55;
  max-width: 960px;
}
.audit-table-wrap {
  margin-top: 12px;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
.audit-table {
  margin-top: 0;
  min-width: 1180px;
}
.cell-wrap {
  max-width: 220px;
}
.hint-sm {
  font-size: 12px;
  color: #64748b;
}
.nowrap {
  white-space: nowrap;
}
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}
</style>
