<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchFutureEndpoints } from '@/api/admin'

const endpoints = ref<{ method: string; path: string; desc: string }[]>([])

onMounted(async () => {
  const { list } = await fetchFutureEndpoints()
  endpoints.value = list
})

async function copyLine(e: { method: string; path: string; desc: string }) {
  const text = `${e.method} ${e.path}  —  ${e.desc}`
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.warning('复制失败，请手动选择文本')
  }
}
</script>

<template>
  <section class="panel active">
    <div class="card">
      <h3>扩展接口清单</h3>
      <p class="hint" style="margin-top: 6px">点击一行可复制整行说明，便于对接文档。</p>
      <ul class="hint" style="line-height: 2; margin-top: 8px; padding-left: 18px; list-style: none">
        <li v-for="(e, i) in endpoints" :key="i" style="cursor: pointer" @click="copyLine(e)">
          <code style="color: var(--cyan)">{{ e.method }} {{ e.path }}</code> — {{ e.desc }}
        </li>
      </ul>
    </div>
  </section>
</template>
