<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchFutureEndpoints } from '@/api/admin'

const endpoints = ref<{ method: string; path: string; desc: string }[]>([])

onMounted(async () => {
  const { list } = await fetchFutureEndpoints()
  endpoints.value = list
})
</script>

<template>
  <section class="panel active">
    <div class="card">
      <h3>菜单 / API 占位</h3>
      <ul class="hint" style="line-height: 2; margin-top: 8px; padding-left: 18px">
        <li v-for="(e, i) in endpoints" :key="i">
          <code style="color: var(--cyan)">{{ e.method }} {{ e.path }}</code> — {{ e.desc }}
        </li>
      </ul>
    </div>
  </section>
</template>
