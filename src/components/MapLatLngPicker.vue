<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAmapGlobal, loadAmapScript } from '@/lib/amapLoader'

type AmapLngLat = { getLng?: () => number; getLat?: () => number; lng?: number; lat?: number }

type MapSearchHit = {
  name: string
  address: string
  lng: number
  lat: number
}

const props = withDefaults(
  defineProps<{
    lat?: string | null
    lng?: string | null
    disabled?: boolean
  }>(),
  { lat: '', lng: '', disabled: false },
)

const emit = defineEmits<{
  (e: 'update:lat', v: string): void
  (e: 'update:lng', v: string): void
}>()

const mapRootRef = ref<HTMLElement | null>(null)
const loadError = ref('')
const mapReady = ref(false)
const searchQ = ref('')
const searching = ref(false)
const searchResults = ref<MapSearchHit[]>([])

let map: Record<string, unknown> | null = null
let marker: Record<string, unknown> | null = null

function lngLatNums(ll: AmapLngLat | number[] | null | undefined): { lng: number; lat: number } {
  if (Array.isArray(ll) && ll.length >= 2) {
    return { lng: Number(ll[0]), lat: Number(ll[1]) }
  }
  if (!ll || typeof ll !== 'object') return { lng: NaN, lat: NaN }
  const o = ll as AmapLngLat
  const lng = typeof o.getLng === 'function' ? o.getLng()! : Number(o.lng)
  const lat = typeof o.getLat === 'function' ? o.getLat()! : Number(o.lat)
  return { lng, lat }
}

function parseCenter(): { lng: number; lat: number } {
  const lat = Number.parseFloat(String(props.lat || '').trim())
  const lng = Number.parseFloat(String(props.lng || '').trim())
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lng, lat }
  }
  return { lng: 113.264385, lat: 23.129112 }
}

function emitPos(lng: number, lat: number) {
  emit('update:lat', lat.toFixed(6))
  emit('update:lng', lng.toFixed(6))
}

function poiToHit(poi: Record<string, unknown>): MapSearchHit | null {
  const loc = poi.location as AmapLngLat | number[] | undefined
  if (loc == null) return null
  const { lng, lat } = lngLatNums(loc)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return {
    name: String(poi.name || ''),
    address: String(poi.address || ''),
    lng,
    lat,
  }
}

function runPlaceSearch(keyword: string) {
  if (!map) {
    searching.value = false
    return
  }
  const AMap = getAmapGlobal() as {
    plugin: (names: string | string[], cb: () => void) => void
    PlaceSearch: new (opts: Record<string, unknown>) => {
      search: (kw: string, cb: (status: string, result: Record<string, unknown>) => void) => void
    }
  }
  // Array form matches official 2.0 docs; bind map so search service runs in same context as the map.
  AMap.plugin(['AMap.PlaceSearch'], () => {
    const ps = new AMap.PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
      citylimit: false,
      map,
    })
    ps.search(keyword, (status: string, result: Record<string, unknown>) => {
      searching.value = false
      const info = String((result as { info?: string }).info || '')
      const poiList = result.poiList as { pois?: Record<string, unknown>[] } | undefined
      const pois = poiList?.pois || []
      const statusLc = String(status || '').toLowerCase()
      const statusOk = statusLc === 'complete'
      const infoOk = info === 'OK' || info === 'TIP_CITIES' || info === 'TIP_NEARBY'

      if (statusLc === 'error') {
        searchResults.value = []
        ElMessage.error(
          info ||
            '地点搜索失败（请确认 VITE_AMAP_WEB_KEY；2021-12-02 后申请的 Key 需配置 VITE_AMAP_SECURITY_JS_CODE，并在控制台绑定 JS API 域名白名单）',
        )
        return
      }

      if (statusLc === 'no_data' || ((statusOk || infoOk) && !pois.length)) {
        searchResults.value = []
        ElMessage.info('无匹配结果')
        return
      }

      if (!statusOk && !pois.length) {
        searchResults.value = []
        ElMessage.info(info ? String(info) : '未找到相关地点，请换关键词试试')
        return
      }

      const hits = pois.map((p) => poiToHit(p)).filter((h): h is MapSearchHit => h != null)
      searchResults.value = hits
      if (!hits.length) {
        ElMessage.info('无匹配结果')
      }
    })
  })
}

function onSearch() {
  if (props.disabled) return
  const q = searchQ.value.trim()
  if (!q) {
    ElMessage.warning('请输入地址、园区名或地标关键词')
    return
  }
  if (!mapReady.value) return
  searching.value = true
  searchResults.value = []
  try {
    runPlaceSearch(q)
  } catch {
    searching.value = false
    ElMessage.error('搜索失败')
  }
}

function pickHit(hit: MapSearchHit) {
  if (props.disabled || !marker || !map) return
  ;(marker as { setPosition: (p: number[]) => void }).setPosition([hit.lng, hit.lat])
  const m = map as { setZoomAndCenter?: (z: number, center: number[]) => void; setCenter?: (c: number[]) => void; setZoom?: (z: number) => void }
  if (typeof m.setZoomAndCenter === 'function') {
    m.setZoomAndCenter(16, [hit.lng, hit.lat])
  } else {
    m.setCenter?.([hit.lng, hit.lat])
    m.setZoom?.(16)
  }
  emitPos(hit.lng, hit.lat)
  searchResults.value = []
  void nextTick(() => map && (map as { resize?: () => void }).resize?.())
}

onMounted(async () => {
  loadError.value = ''
  const el = mapRootRef.value
  if (!el) return
  try {
    await loadAmapScript()
    const AMap = getAmapGlobal() as {
      Map: new (container: HTMLElement, opts: Record<string, unknown>) => Record<string, unknown>
      Marker: new (opts: Record<string, unknown>) => Record<string, unknown>
    }
    if (!AMap?.Map || !AMap.Marker) {
      loadError.value = '高德 AMap 未就绪'
      return
    }
    const { lng, lat } = parseCenter()
    map = new AMap.Map(el, {
      zoom: 14,
      center: [lng, lat],
      viewMode: '2D',
      resizeEnable: true,
    })
    marker = new AMap.Marker({
      position: [lng, lat],
      map,
      draggable: !props.disabled,
    })
    ;(marker as { on: (ev: string, fn: (e: { lnglat: AmapLngLat }) => void) => void }).on('dragend', (e) => {
      const { lng: gl, lat: la } = lngLatNums(e.lnglat)
      emitPos(gl, la)
    })
    ;(map as { on: (ev: string, fn: (e: { lnglat: AmapLngLat }) => void) => void }).on('click', (e) => {
      if (props.disabled) return
      const { lng: gl, lat: la } = lngLatNums(e.lnglat)
      ;(marker as { setPosition: (p: number[]) => void }).setPosition([gl, la])
      emitPos(gl, la)
    })
    mapReady.value = true
    void nextTick(() => setTimeout(() => (map as { resize?: () => void })?.resize?.(), 200))
  } catch (e: unknown) {
    loadError.value = e instanceof Error ? e.message : String(e)
  }
})

onUnmounted(() => {
  try {
    ;(map as { destroy?: () => void } | null)?.destroy?.()
  } catch {
    /* map may be half-initialized */
  }
  map = null
  marker = null
  mapReady.value = false
})

watch(
  () => [props.lat, props.lng] as const,
  () => {
    if (!marker) return
    const { lng, lat } = parseCenter()
    ;(marker as { setPosition?: (p: number[]) => void }).setPosition?.([lng, lat])
  },
)

watch(
  () => props.disabled,
  (d) => {
    ;(marker as { setDraggable?: (v: boolean) => void }).setDraggable?.(!d)
    if (d) searchResults.value = []
  },
)
</script>

<template>
  <div class="map-latlng-wrap">
    <p class="hint" style="margin: 0 0 8px">
      使用<strong>高德地图</strong>（GCJ-02）。可<strong>搜索地点</strong>后从列表选择，或在地图上点击 / 拖动标记；结果同步到上方纬度 / 经度。
    </p>
    <p v-if="loadError" class="map-latlng-err">{{ loadError }}</p>
    <div v-else class="map-search-row">
      <input
        v-model="searchQ"
        type="search"
        class="map-search-input"
        placeholder="搜索：地址、园区、写字楼、路口…"
        :disabled="disabled || !mapReady"
        maxlength="80"
        @keyup.enter="onSearch"
      />
      <button type="button" class="btn btn-primary map-search-btn" :disabled="disabled || !mapReady || searching" @click="onSearch">
        {{ searching ? '搜索中…' : '搜索' }}
      </button>
    </div>
    <ul v-if="searchResults.length && !disabled" class="map-search-hits" role="listbox">
      <li
        v-for="(h, i) in searchResults"
        :key="`${h.lng}-${h.lat}-${i}`"
        role="option"
        tabindex="0"
        class="map-search-hit"
        @click="pickHit(h)"
        @keyup.enter="pickHit(h)"
      >
        <span class="map-search-hit-name">{{ h.name }}</span>
        <span v-if="h.address" class="map-search-hit-addr">{{ h.address }}</span>
      </li>
    </ul>
    <div ref="mapRootRef" class="map-latlng-host" />
  </div>
</template>

<style scoped>
.map-search-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.map-search-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 8px;
  font-size: 13px;
}
.map-search-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  white-space: nowrap;
}
.map-search-hits {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
  max-height: 160px;
  overflow-y: auto;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  background: #f8fafc;
}
.map-search-hit {
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 12px;
  line-height: 1.4;
}
.map-search-hit:last-child {
  border-bottom: none;
}
.map-search-hit:hover,
.map-search-hit:focus {
  background: #e0f2fe;
  outline: none;
}
.map-search-hit-name {
  display: block;
  font-weight: 600;
  color: #0f172a;
}
.map-search-hit-addr {
  display: block;
  color: #64748b;
  margin-top: 2px;
}
.map-latlng-host {
  height: 260px;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.12);
}
.map-latlng-err {
  margin: 0 0 8px;
  font-size: 13px;
  color: #b91c1c;
  line-height: 1.45;
}
</style>
