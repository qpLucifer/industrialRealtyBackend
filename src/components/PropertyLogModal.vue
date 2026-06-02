<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchPropertyLogs } from '@/api/admin'
import { formatTimelineLine } from '@/lib/beijingTime'

const props = defineProps<{
  visible: boolean
  code: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const list = ref<{ line: string; sub: string }[]>([])
const loading = ref(false)
const loadError = ref('')

function isRejectLog(row: { line: string; sub: string }) {
  return /驳回/.test(`${row.line} ${row.sub}`)
}

async function load() {
  if (!props.code) return
  loading.value = true
  loadError.value = ''
  try {
    const r = await fetchPropertyLogs(props.code)
    list.value = r.list
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
    list.value = []
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:visible', false)
}

watch(
  () => [props.visible, props.code] as const,
  ([open, code]) => {
    if (open && code) void load()
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="code ? `房源日志 · ${code}` : '房源日志'"
    width="560px"
    class="property-log-dialog"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-if="loading" class="property-log-state">加载中…</div>
    <div v-else-if="loadError" class="property-log-state">
      <p>{{ loadError }}</p>
      <button type="button" class="btn btn-sm" @click="load">重试</button>
    </div>
    <ul v-else-if="list.length" class="property-log-list">
      <li v-for="(row, idx) in list" :key="idx" class="property-log-item" :class="{ 'is-reject': isRejectLog(row) }">
        <div class="property-log-line">{{ row.line }}</div>
        <div v-if="row.sub" class="property-log-sub">{{ formatTimelineLine(row.sub) }}</div>
      </li>
    </ul>
    <div v-else class="property-log-state">暂无操作日志</div>
    <template #footer>
      <button type="button" class="btn" @click="close">关闭</button>
    </template>
  </el-dialog>
</template>

<style scoped>
.property-log-state {
  padding: 24px 8px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

.property-log-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 420px;
  overflow-y: auto;
}

.property-log-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.property-log-item + .property-log-item {
  margin-top: 10px;
}

.property-log-item.is-reject {
  background: #fff1f2;
  border-color: rgba(225, 29, 72, 0.15);
}

.property-log-line {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.45;
}

.property-log-item.is-reject .property-log-line {
  color: #be123c;
}

.property-log-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  word-break: break-word;
}
</style>
