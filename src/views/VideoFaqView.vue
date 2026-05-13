<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchVideoFaq } from '@/api/admin'
import type { VideoFaqRow } from '@/types/domain'

const list = ref<VideoFaqRow[]>([])
const q = ref('')

onMounted(async () => {
  const { list: rows } = await fetchVideoFaq()
  list.value = rows
})

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return list.value
  return list.value.filter((r) => {
    const blob = `${r.keywords} ${r.question} ${r.industry}`.toLowerCase()
    return blob.includes(s)
  })
})

function tagTone(t: VideoFaqRow['tags'][0]['tone']) {
  return t
}

function onNew() {
  ElMessage.info('打开视频条目表单（原型）· 关联 VOD 与小程序搜索标签')
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="onNew">＋ 关联视频条目</button>
      <input v-model="q" type="search" placeholder="搜索：问题关键词 / 行业 / 标签…" style="min-width: 280px" />
      <select>
        <option>全部状态</option>
        <option>已上架小程序</option>
        <option>剪辑中</option>
      </select>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>客户提问摘要</th>
            <th>行业</th>
            <th>视频</th>
            <th>标签</th>
            <th>小程序可搜</th>
            <th>更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id">
            <td>{{ r.question }}</td>
            <td>{{ r.industry }}</td>
            <td>{{ r.videoPath }}</td>
            <td>
              <span v-for="t in r.tags" :key="t.label" class="tag" :class="tagTone(t.tone)" style="margin-right: 4px">{{
                t.label
              }}</span>
            </td>
            <td><span class="tag mint">{{ r.miniProgramSearch ? '是' : '否' }}</span></td>
            <td>{{ r.updatedAt }}</td>
            <td><button type="button" class="btn" style="padding: 6px 10px">编辑</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" style="margin-top: 12px">
      运营收集一线客户问题 → 剪辑短视频 → 后台维护标题/标签；小程序端提供搜索入口，命中摘要与标签。
    </p>
  </section>
</template>
