<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    src: string
    label?: string
    removable?: boolean
  }>(),
  {
    label: '跟进语音',
    removable: false,
  },
)

const emit = defineEmits<{ remove: [] }>()

const playing = ref(false)
const durationSec = ref(0)
const currentSec = ref(0)
const bufferedSec = ref(0)
const playPending = ref(false)
const waiting = ref(false)
const srcReady = ref('')

let audio: HTMLAudioElement | null = null
let playPendingTimer: ReturnType<typeof setTimeout> | null = null

const isLoading = computed(() => playPending.value || waiting.value)

const progressPct = computed(() => {
  if (durationSec.value <= 0) return 0
  return Math.min(100, (currentSec.value / durationSec.value) * 100)
})

const bufferPct = computed(() => {
  if (durationSec.value > 0) {
    return Math.min(100, (bufferedSec.value / durationSec.value) * 100)
  }
  if (bufferedSec.value > 0) return Math.min(100, bufferedSec.value * 4)
  return 0
})

const durationLabel = computed(() =>
  durationSec.value > 0 ? formatTime(durationSec.value) : '--:--',
)

const timeDisplay = computed(() => {
  if (waiting.value && (playing.value || playPending.value)) return '缓冲中…'
  if (playPending.value) return '加载中…'
  if (playing.value || currentSec.value > 0) {
    return `${formatTime(currentSec.value)} / ${durationLabel.value}`
  }
  return durationSec.value > 0 ? formatTime(durationSec.value) : durationLabel.value
})

const showWaves = computed(() => playing.value && !waiting.value && !playPending.value)

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function syncBufferedFromEl(el: HTMLAudioElement) {
  try {
    if (el.buffered.length > 0) {
      const end = el.buffered.end(el.buffered.length - 1)
      if (Number.isFinite(end) && end >= 0) bufferedSec.value = end
    }
  } catch {
    /* ignore */
  }
}

function syncDurationFromEl(el: HTMLAudioElement) {
  const d = Number(el.duration)
  if (Number.isFinite(d) && d > 0) durationSec.value = d
}

function clearPlayPendingTimer() {
  if (playPendingTimer) {
    clearTimeout(playPendingTimer)
    playPendingTimer = null
  }
}

function clearLoadingFlags() {
  playPending.value = false
  waiting.value = false
  clearPlayPendingTimer()
}

function destroyAudio() {
  clearPlayPendingTimer()
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    audio = null
  }
  playing.value = false
  clearLoadingFlags()
}

function resetPlaybackState() {
  destroyAudio()
  durationSec.value = 0
  currentSec.value = 0
  bufferedSec.value = 0
}

function bindAudioHandlers(el: HTMLAudioElement) {
  el.addEventListener('loadedmetadata', () => syncDurationFromEl(el))
  el.addEventListener('durationchange', () => syncDurationFromEl(el))
  el.addEventListener('canplay', () => {
    syncDurationFromEl(el)
    syncBufferedFromEl(el)
    if (bufferedSec.value > currentSec.value + 0.2) waiting.value = false
  })
  el.addEventListener('waiting', () => {
    if (playPending.value || playing.value) waiting.value = true
  })
  el.addEventListener('playing', () => {
    playing.value = true
    playPending.value = false
    waiting.value = false
    clearPlayPendingTimer()
    syncDurationFromEl(el)
  })
  el.addEventListener('timeupdate', () => {
    currentSec.value = el.currentTime
    syncDurationFromEl(el)
    syncBufferedFromEl(el)
    if (waiting.value && bufferedSec.value > currentSec.value + 0.25) {
      waiting.value = false
    }
  })
  el.addEventListener('pause', () => {
    playing.value = false
    playPending.value = false
    waiting.value = false
    clearPlayPendingTimer()
  })
  el.addEventListener('ended', () => {
    playing.value = false
    currentSec.value = 0
    playPending.value = false
    waiting.value = false
    clearPlayPendingTimer()
  })
  el.addEventListener('error', () => {
    playing.value = false
    clearLoadingFlags()
    ElMessage.warning('音频无法播放')
  })
  el.addEventListener('progress', () => syncBufferedFromEl(el))
}

function ensureAudio(): boolean {
  if (audio) return true
  if (!srcReady.value) return false
  audio = new Audio(srcReady.value)
  audio.preload = 'none'
  bindAudioHandlers(audio)
  return true
}

function prepareSrc(url: string) {
  resetPlaybackState()
  srcReady.value = String(url || '').trim()
}

async function togglePlay() {
  if (!srcReady.value || playPending.value) return
  if (playing.value && audio) {
    audio.pause()
    return
  }
  if (!ensureAudio() || !audio) return

  playPending.value = true
  waiting.value = false
  clearPlayPendingTimer()
  playPendingTimer = setTimeout(() => {
    if (playPending.value && !playing.value) {
      playPending.value = false
      waiting.value = false
      ElMessage.warning('加载超时，请重试')
    }
  }, 20000)

  try {
    await audio.play()
  } catch {
    playing.value = false
    clearLoadingFlags()
    ElMessage.warning('音频无法播放')
  }
}

function onRemove() {
  srcReady.value = ''
  resetPlaybackState()
  emit('remove')
}

watch(
  () => props.src,
  (v) => prepareSrc(v),
  { immediate: true },
)

onUnmounted(() => {
  srcReady.value = ''
  resetPlaybackState()
})
</script>

<template>
  <div
    class="audio-card"
    :class="{
      'audio-card--playing': playing && !isLoading,
      'audio-card--loading': isLoading,
    }"
  >
    <button type="button" class="audio-card__play" @click="togglePlay">
      <span class="audio-card__play-ring" />
      <span v-if="isLoading && !playing" class="audio-card__spinner" />
      <span v-else-if="playing" class="audio-card__icon audio-card__icon--pause">
        <span class="audio-card__bar" />
        <span class="audio-card__bar" />
      </span>
      <span v-else class="audio-card__icon audio-card__icon--play" />
    </button>

    <button type="button" class="audio-card__main" @click="togglePlay">
      <div class="audio-card__head">
        <div class="audio-card__title-row">
          <span class="audio-card__label">{{ label }}</span>
          <span v-if="showWaves" class="audio-card__waves" aria-hidden="true">
            <span class="audio-card__wave" />
            <span class="audio-card__wave" />
            <span class="audio-card__wave" />
          </span>
        </div>
        <span class="audio-card__time" :class="{ 'audio-card__time--loading': isLoading }">
          {{ timeDisplay }}
        </span>
      </div>
      <div class="audio-card__track" :class="{ 'audio-card__track--loading': isLoading && bufferPct <= 0 }">
        <span class="audio-card__buffer" :style="{ width: `${bufferPct}%` }" />
        <span class="audio-card__fill" :style="{ width: `${progressPct}%` }" />
      </div>
    </button>

    <button v-if="removable" type="button" class="audio-card__remove" @click="onRemove">删除</button>
  </div>
</template>

<style scoped>
.audio-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
  padding: 10px 11px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid rgba(26, 58, 108, 0.1);
  box-shadow: 0 1px 6px rgba(15, 23, 42, 0.04);
}

.audio-card--playing {
  border-color: rgba(26, 58, 108, 0.22);
  background: linear-gradient(135deg, #f0f4fa 0%, #e8eef8 100%);
}

.audio-card--loading {
  border-color: rgba(26, 58, 108, 0.16);
}

.audio-card__play {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.audio-card__play-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, #1a3a6c, #2d4f8c);
  box-shadow: 0 3px 8px rgba(26, 58, 108, 0.28);
}

.audio-card--playing .audio-card__play-ring {
  box-shadow: 0 3px 10px rgba(26, 58, 108, 0.36);
}

.audio-card__icon {
  position: relative;
  z-index: 1;
  display: block;
}

.audio-card__spinner {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: audio-spin 0.75s linear infinite;
}

@keyframes audio-spin {
  to {
    transform: rotate(360deg);
  }
}

.audio-card__icon--play {
  width: 0;
  height: 0;
  margin-left: 3px;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 11px solid #fff;
}

.audio-card__icon--pause {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 14px;
  height: 14px;
}

.audio-card__bar {
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: #fff;
}

.audio-card__main {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.audio-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
}

.audio-card__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.audio-card__label {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.audio-card__waves {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.audio-card__wave {
  width: 2px;
  height: 6px;
  border-radius: 1px;
  background: #1a3a6c;
  animation: audio-wave 0.9s ease-in-out infinite;
}

.audio-card__wave:nth-child(2) {
  animation-delay: 0.15s;
  height: 9px;
}

.audio-card__wave:nth-child(3) {
  animation-delay: 0.3s;
  height: 7px;
}

@keyframes audio-wave {
  0%,
  100% {
    transform: scaleY(0.55);
    opacity: 0.55;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.audio-card__time {
  flex-shrink: 0;
  font-size: 11px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.audio-card__time--loading {
  color: #1a3a6c;
}

.audio-card__track {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: rgba(26, 58, 108, 0.12);
  overflow: hidden;
}

.audio-card__track--loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(26, 58, 108, 0.18) 50%,
    transparent 100%
  );
  animation: buffer-shimmer 1.2s ease-in-out infinite;
}

@keyframes buffer-shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.audio-card__buffer {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: rgba(26, 58, 108, 0.22);
  transition: width 0.2s linear;
  z-index: 0;
}

.audio-card__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1a3a6c, #3d5f94);
  transition: width 0.12s linear;
  z-index: 1;
}

.audio-card__remove {
  flex-shrink: 0;
  padding: 4px 0 4px 6px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1.2;
}

.audio-card__remove:hover {
  color: #64748b;
}
</style>
