<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps<{
  lat: string
  lng: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:lat', v: string): void
  (e: 'update:lng', v: string): void
}>()

const mapRootRef = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let marker: L.Marker | null = null

const pinIcon = L.divIcon({
  className: 'map-latlng-pin-wrap',
  html: '<div class="map-latlng-pin"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function parseLL(): [number, number] {
  const la = Number.parseFloat(String(props.lat || '').trim())
  const lo = Number.parseFloat(String(props.lng || '').trim())
  if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) {
    return [la, lo]
  }
  return [23.129163, 113.264435]
}

function emitLL(lat: number, lng: number) {
  emit('update:lat', lat.toFixed(6))
  emit('update:lng', lng.toFixed(6))
}

function setMarkerPos(pos: L.LatLngExpression) {
  marker?.setLatLng(pos)
}

onMounted(() => {
  const el = mapRootRef.value
  if (!el) return
  const center = parseLL()
  map = L.map(el, { zoomControl: true }).setView(center, 14)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map)
  marker = L.marker(center, { icon: pinIcon, draggable: !props.disabled }).addTo(map)
  marker.on('dragend', () => {
    const p = marker!.getLatLng()
    emitLL(p.lat, p.lng)
  })
  map.on('click', (e) => {
    if (props.disabled) return
    emitLL(e.latlng.lat, e.latlng.lng)
    setMarkerPos(e.latlng)
  })
  void nextTick(() => {
    setTimeout(() => map?.invalidateSize(), 200)
  })
})

onUnmounted(() => {
  map?.remove()
  map = null
  marker = null
})

watch(
  () => [props.lat, props.lng] as const,
  () => {
    if (!marker) return
    const [la, lo] = parseLL()
    const cur = marker.getLatLng()
    if (Math.abs(cur.lat - la) > 1e-5 || Math.abs(cur.lng - lo) > 1e-5) {
      setMarkerPos([la, lo])
    }
  },
)

watch(
  () => props.disabled,
  (d) => {
    if (d) marker?.dragging?.disable()
    else marker?.dragging?.enable()
  },
)
</script>

<template>
  <div class="map-latlng-wrap">
    <p class="hint" style="margin: 0 0 8px">
      在地图上点击或拖动图钉；坐标为 WGS84，将同步到上方纬度 / 经度输入框。
    </p>
    <div ref="mapRootRef" class="map-latlng-host" />
  </div>
</template>

<style scoped>
.map-latlng-host {
  height: 220px;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.12);
}
:deep(.map-latlng-pin-wrap) {
  background: transparent;
  border: none;
}
:deep(.map-latlng-pin) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0ea5e9;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
}
</style>
