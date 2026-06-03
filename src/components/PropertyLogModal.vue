<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchPropertyLogs } from '@/api/admin'
import PropertyLogEntryRow from '@/components/PropertyLogEntryRow.vue'
import PropertyFollowModal from '@/components/PropertyFollowModal.vue'
import type { PropertyLogEntry } from '@/types/domain'

const props = defineProps<{
  visible: boolean
  code: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const list = ref<PropertyLogEntry[]>([])
const loading = ref(false)
const loadError = ref('')
const followVisible = ref(false)
const expandedMediaIdx = ref<number | null>(null)

async function load() {
  if (!props.code) return
  loading.value = true
  loadError.value = ''
  expandedMediaIdx.value = null
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

function openFollow() {
  followVisible.value = true
}

function onFollowSaved() {
  void load()
}

function toggleLogMedia(idx: number) {
  expandedMediaIdx.value = expandedMediaIdx.value === idx ? null : idx
}

watch(
  () => [props.visible, props.code] as const,
  ([open, code]) => {
    if (open && code) void load()
  },
)
</script>

<template>
  <div>
    <el-dialog
      :model-value="visible"
      :title="code ? `房源日志 · ${code}` : '房源日志'"
      width="620px"
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
        <PropertyLogEntryRow
          v-for="(row, idx) in list"
          :key="idx"
          :entry="row"
          :media-expanded="expandedMediaIdx === idx"
          @toggle-media="toggleLogMedia(idx)"
        />
      </ul>
      <div v-else class="property-log-state">暂无操作日志</div>
      <template #footer>
        <button type="button" class="btn btn-primary" @click="openFollow">写跟进</button>
        <button type="button" class="btn" @click="close">关闭</button>
      </template>
    </el-dialog>

    <PropertyFollowModal v-model:visible="followVisible" :code="code" @saved="onFollowSaved" />
  </div>
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
  max-height: 420px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
}
</style>
