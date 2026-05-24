<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createVideoFaqRow,
  deleteVideoFaqRow,
  fetchVideoFaq,
  updateVideoFaqRow,
} from '@/api/admin'
import type { VideoFaqRow } from '@/types/domain'
import AdminListPagination from '@/components/AdminListPagination.vue'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { useAdminListPagination } from '@/composables/useAdminListPagination'
import { formatBeijingDisplay } from '@/lib/beijingTime'
import { uploadVideoMultipart } from '@/lib/mediaUpload'
import { Delete, Edit } from '@element-plus/icons-vue'

const list = ref<VideoFaqRow[]>([])
const { listPage, listPageSize, listTotal, resetListPage, applyPagedResult, listQueryParams } =
  useAdminListPagination()
const q = ref('')
const drawer = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  keywords: '',
  question: '',
  industry: '通用',
  videoPath: '',
  tagsCsv: '',
  miniProgramSearch: true,
  summary: '',
})
const uploadingVideo = ref(false)
const videoUploadPercent = ref(0)

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return list.value
  return list.value.filter((r) => {
    const blob = `${r.keywords} ${r.question} ${r.industry} ${r.summary || ''}`.toLowerCase()
    return blob.includes(s)
  })
})

function tagsFromCsv(csv: string): VideoFaqRow['tags'] {
  return csv
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((label) => ({ label, tone: 'mint' as const }))
}

function csvFromTags(tags: VideoFaqRow['tags']) {
  return tags.map((t) => t.label).join(',')
}

function tagTone(t: VideoFaqRow['tags'][0]['tone']) {
  return t
}

async function load() {
  const result = await fetchVideoFaq(listQueryParams())
  list.value = result.list
  applyPagedResult(result)
}

function onFilterChange() {
  resetListPage()
  void load()
}

function openNew() {
  editingId.value = null
  form.keywords = ''
  form.question = ''
  form.industry = '通用'
  form.videoPath = ''
  form.tagsCsv = ''
  form.miniProgramSearch = true
  form.summary = ''
  drawer.value = true
}

function openEdit(row: VideoFaqRow) {
  editingId.value = row.id
  form.keywords = row.keywords
  form.question = row.question
  form.industry = row.industry
  form.videoPath = row.videoPath
  form.tagsCsv = csvFromTags(row.tags || [])
  form.miniProgramSearch = row.miniProgramSearch
  form.summary = row.summary || ''
  drawer.value = true
}

async function onSave() {
  const tags = tagsFromCsv(form.tagsCsv)
  const payload = {
    keywords: form.keywords.trim(),
    question: form.question.trim(),
    industry: form.industry.trim() || '通用',
    videoPath: form.videoPath.trim(),
    tags,
    miniProgramSearch: form.miniProgramSearch,
    summary: form.summary.trim(),
  }
  if (editingId.value) {
    await updateVideoFaqRow(editingId.value, payload)
    ElMessage.success('已更新')
  } else {
    await createVideoFaqRow(payload)
    ElMessage.success('已创建')
  }
  drawer.value = false
  await load()
}

async function onDelete(row: VideoFaqRow) {
  try {
    await ElMessageBox.confirm(`删除条目「${row.question.slice(0, 40)}…」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteVideoFaqRow(row.id)
  ElMessage.success('已删除')
  await load()
}

async function onVideoPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingVideo.value = true
  videoUploadPercent.value = 0
  try {
    const { url } = await uploadVideoMultipart(file, 'video-faq', (pct) => {
      videoUploadPercent.value = pct
    })
    form.videoPath = url
    ElMessage.success('视频已上传，URL 已填入')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '视频上传失败')
  } finally {
    uploadingVideo.value = false
    videoUploadPercent.value = 0
    input.value = ''
  }
}

onMounted(load)
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openNew">＋ 关联视频条目</button>
      <input v-model="q" type="search" placeholder="搜索：问题关键词 / 行业 / 标签…" style="min-width: 280px" />
      <button type="button" class="btn" @click="load">刷新</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>客户提问摘要</th>
            <th>视频摘要</th>
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
            <td class="cell-wrap hint-sm">{{ r.summary || '—' }}</td>
            <td>{{ r.industry }}</td>
            <td>{{ r.videoPath }}</td>
            <td>
              <span v-for="t in r.tags" :key="t.label" class="tag" :class="tagTone(t.tone)" style="margin-right: 4px">{{ t.label }}</span>
            </td>
            <td><span class="tag mint">{{ r.miniProgramSearch ? '是' : '否' }}</span></td>
            <td>{{ formatBeijingDisplay(r.updatedAt) || r.updatedAt || '—' }}</td>
            <td>
              <div class="row-actions">
                <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(r)" />
                <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(r)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminListPagination
        v-model:page="listPage"
        v-model:page-size="listPageSize"
        :total="listTotal"
        @change="load"
      />
    </div>

    <el-drawer v-model="drawer" :title="editingId ? '编辑视频 FAQ' : '新建视频 FAQ'" direction="rtl" size="min(480px, 100%)">
      <div class="form-grid">
        <div class="full">
          <label>关键词</label>
          <input v-model="form.keywords" type="text" />
        </div>
        <div class="full">
          <label>问题摘要</label>
          <textarea v-model="form.question" rows="3" />
        </div>
        <div>
          <label>行业</label>
          <input v-model="form.industry" type="text" />
        </div>
        <div>
          <label>视频路径</label>
          <input v-model="form.videoPath" type="text" />
        </div>
        <div class="full">
          <label>上传到 OSS（视频）</label>
          <input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" :disabled="uploadingVideo" @change="onVideoPick" />
          <div v-if="uploadingVideo" class="upload-progress-row">
            <div class="upload-progress-bar"><div class="upload-progress-fill" :style="{ width: videoUploadPercent + '%' }" /></div>
            <span class="hint">视频上传中 {{ videoUploadPercent }}%</span>
          </div>
        </div>
        <div v-if="form.videoPath.trim()" class="full">
          <label>视频预览</label>
          <video
            class="faq-video-preview"
            :src="form.videoPath.trim()"
            controls
            preload="metadata"
            referrerpolicy="no-referrer"
          />
        </div>
        <div class="full">
          <label>标签（逗号分隔）</label>
          <input v-model="form.tagsCsv" type="text" placeholder="丙二类,黄埔" />
        </div>
        <div class="full">
          <label>视频摘要</label>
          <textarea v-model="form.summary" rows="3" placeholder="视频内容要点，小程序列表与复制话术会展示" />
        </div>
        <div class="full switch-row" style="border: none; padding: 0">
          <span>小程序可搜</span>
          <el-switch v-model="form.miniProgramSearch" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 18px">
        <button type="button" class="btn btn-primary" @click="onSave">保存</button>
        <button type="button" class="btn" @click="drawer = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.hint-sm {
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}
.cell-wrap {
  max-width: 280px;
  white-space: normal;
  word-break: break-word;
}
.faq-video-preview {
  width: 100%;
  max-height: 260px;
  border-radius: 10px;
  background: #0f172a;
  margin-top: 8px;
}
</style>
