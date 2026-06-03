<script setup lang="ts">
import { computed } from 'vue'
import { followMediaSummary } from '@/lib/followMediaSummary'

const props = defineProps<{
  expanded: boolean
  imageCount: number
  audioCount: number
}>()

defineEmits<{ toggle: [] }>()

const summary = computed(() => followMediaSummary(props.imageCount, props.audioCount))
const hasMedia = computed(() => props.imageCount > 0 || props.audioCount > 0)
</script>

<template>
  <div v-if="hasMedia" class="follow-media-panel">
    <button type="button" class="follow-media-panel__toggle" @click="$emit('toggle')">
      <span>{{ expanded ? '收起附件' : `展开附件（${summary}）` }}</span>
      <span class="follow-media-panel__chevron">{{ expanded ? '▲' : '▼' }}</span>
    </button>
    <div v-if="expanded" class="follow-media-panel__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.follow-media-panel {
  margin-top: 10px;
}

.follow-media-panel__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(26, 58, 108, 0.12);
  background: #f1f5f9;
  color: #1a3a6c;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.follow-media-panel__toggle:hover {
  background: #e8eef6;
}

.follow-media-panel__chevron {
  flex-shrink: 0;
  font-size: 11px;
  color: #64748b;
}

.follow-media-panel__body {
  margin-top: 10px;
}
</style>
