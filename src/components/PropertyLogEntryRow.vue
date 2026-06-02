<script setup lang="ts">
import type { PropertyLogEntry } from '@/types/domain'
import { formatTimelineLine } from '@/lib/beijingTime'
import { applyCosImageProcess } from '@/lib/mediaImageUrl'

defineProps<{ entry: PropertyLogEntry }>()

function isReject(entry: PropertyLogEntry) {
  return /驳回/.test(`${entry.line} ${entry.sub}`)
}

function imageSrc(url: string) {
  return applyCosImageProcess(url)
}
</script>

<template>
  <li class="property-log-item" :class="{ 'is-reject': isReject(entry) }">
    <div class="property-log-line">{{ entry.line }}</div>
    <div v-if="entry.kind === 'follow-up' && entry.displayLine" class="property-log-sub">{{ entry.displayLine }}</div>
    <div v-else-if="entry.sub" class="property-log-sub">{{ formatTimelineLine(entry.sub) }}</div>
    <p v-if="entry.kind === 'follow-up' && entry.note" class="property-log-note">{{ entry.note }}</p>
    <div v-if="entry.imageUrls?.length" class="property-log-images">
      <a
        v-for="img in entry.imageUrls"
        :key="img"
        :href="imageSrc(img)"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img :src="imageSrc(img)" alt="" class="property-log-thumb" referrerpolicy="no-referrer" />
      </a>
    </div>
    <div v-if="entry.audioUrls?.length" class="property-log-audios">
      <audio v-for="aud in entry.audioUrls" :key="aud" :src="aud" controls preload="metadata" />
    </div>
  </li>
</template>

<style scoped>
.property-log-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(15, 23, 42, 0.06);
  list-style: none;
}

.property-log-item + .property-log-item {
  margin-top: 0;
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

.property-log-sub,
.property-log-note {
  margin: 6px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  word-break: break-word;
}

.property-log-note {
  white-space: pre-wrap;
}

.property-log-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.property-log-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: block;
}

.property-log-audios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.property-log-audios audio {
  width: 100%;
  height: 32px;
}
</style>
