<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchRegionBindings, fetchRegionTree } from '@/api/admin'
import type { RegionBindingRow, RegionTreeLine } from '@/types/domain'

const lines = ref<RegionTreeLine[]>([])
const bindings = ref<RegionBindingRow[]>([])

onMounted(async () => {
  const t = await fetchRegionTree()
  lines.value = t.lines
  const b = await fetchRegionBindings()
  bindings.value = b.list
})
</script>

<template>
  <section class="panel active">
    <div class="grid-2" style="grid-template-columns: 320px 1fr">
      <div class="card">
        <h3>行政区归档树</h3>
        <p class="hint">省 → 市 → 区县 → 乡镇 / 产业园。房源与客户节点挂载于此。</p>
        <ul class="hint" style="margin-top: 14px; line-height: 2; list-style: none; padding: 0">
          <li v-for="(l, i) in lines" :key="i" :style="{ paddingLeft: l.indentPx + 'px' }">{{ l.text }}</li>
        </ul>
        <button type="button" class="btn btn-primary" style="margin-top: 16px; width: 100%">新增产业园节点（演示）</button>
      </div>
      <div class="card">
        <h3>员工绑定预览</h3>
        <table class="data" style="margin-top: 8px">
          <thead>
            <tr>
              <th>员工</th>
              <th>授权节点 ID</th>
              <th>跨区域导出</th>
              <th>跨区查看</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in bindings" :key="i">
              <td>{{ r.staffName }}</td>
              <td>{{ r.nodeIds }}</td>
              <td><span class="tag rose">{{ r.crossExport }}</span></td>
              <td><span class="tag rose">{{ r.crossView }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
