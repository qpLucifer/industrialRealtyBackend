<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteAnnouncementApi,
  fetchAnnouncements,
  publishAnnouncement,
  updateAnnouncementApi,
} from '@/api/admin'
import type { AnnouncementRow } from '@/types/domain'
import { Delete, Edit } from '@element-plus/icons-vue'
import { resolveApiErrorMessage } from '@/lib/apiError'

const list = ref<AnnouncementRow[]>([])
const modal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  title: '',
  body: '',
  scope: '全员',
  popup: '否',
  popupStart: '',
  popupEnd: '',
  /** 青绿色 | 琥珀色 — stored server-side as mint / amber */
  statusToneCn: '青绿色' as '青绿色' | '琥珀色',
})

function toneDbToCn(t: string): '青绿色' | '琥珀色' {
  return t === 'amber' ? '琥珀色' : '青绿色'
}

async function load() {
  const { list: rows } = await fetchAnnouncements()
  list.value = rows
}

function statusClass(t: AnnouncementRow['statusTone']) {
  return t === 'mint' ? 'mint' : 'amber'
}

/** List column: show popup window range without ISO "T" (e.g. 2026-05-14 19:36). */
function formatAnnouncementListDateTime(raw: string): string {
  let s = String(raw || '').trim()
  if (!s) return ''
  s = s.replace('T', ' ')
  s = s.replace(/Z$/i, '')
  s = s.replace(/\.\d+$/, '')
  s = s.replace(/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}):00$/, '$1')
  return s
}

function popupWindowLabel(row: AnnouncementRow): string {
  if (row.popup !== '是') return '—'
  const start = String(row.popupStart || '').trim()
  const end = String(row.popupEnd || '').trim()
  if (!start && !end) return '—'
  return `${start ? formatAnnouncementListDateTime(start) : '—'} ~ ${end ? formatAnnouncementListDateTime(end) : '—'}`
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.body = ''
  form.scope = '全员'
  form.popup = '否'
  form.popupStart = ''
  form.popupEnd = ''
  form.statusToneCn = '青绿色'
  modal.value = true
}

function openEdit(row: AnnouncementRow) {
  editingId.value = row.id
  form.title = row.title
  form.body = row.body || ''
  form.scope = row.scope
  form.popup = row.popup
  form.popupStart = String(row.popupStart || '').trim()
  form.popupEnd = String(row.popupEnd || '').trim()
  form.statusToneCn = toneDbToCn(row.statusTone)
  modal.value = true
}

async function onPublish() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (!form.body.trim()) {
    ElMessage.warning('请填写正文')
    return
  }
  if (form.popup === '是') {
    if (!form.popupStart.trim() || !form.popupEnd.trim()) {
      ElMessage.warning('小程序弹窗为「是」时，请填写弹窗展示的开始与结束时间')
      return
    }
  }
  const payload = {
    title: form.title.trim(),
    body: form.body.trim(),
    scope: form.scope,
    popup: form.popup,
    popupStart: form.popup === '是' ? form.popupStart.trim() : '',
    popupEnd: form.popup === '是' ? form.popupEnd.trim() : '',
    statusToneCn: form.statusToneCn,
  }
  try {
    if (editingId.value == null) {
      await publishAnnouncement(payload)
      ElMessage.success('公告已发布')
    } else {
      await updateAnnouncementApi(editingId.value, payload)
      ElMessage.success('公告已更新')
    }
  } catch (e) {
    ElMessage.error(resolveApiErrorMessage(e, '保存失败'))
    return
  }
  modal.value = false
  await load()
}

async function onDelete(row: AnnouncementRow) {
  try {
    await ElMessageBox.confirm(`删除公告「${row.title}」？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteAnnouncementApi(row.id)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openCreate">＋ 新建公告</button>
      <button type="button" class="btn" @click="load">刷新</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>标题</th>
            <th>推送范围</th>
            <th>小程序弹窗</th>
            <th>开始 / 结束时间</th>
            <th>列表强调色</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.title }}</td>
            <td>{{ r.scope }}</td>
            <td>{{ r.popup }}</td>
            <td class="cell-wrap hint-sm">{{ popupWindowLabel(r) }}</td>
            <td>
              <span class="tag" :class="statusClass(r.statusTone)">{{ toneDbToCn(r.statusTone) }}</span>
            </td>
            <td>
              <div class="row-actions">
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" :icon="Edit" circle plain size="small" @click="openEdit(r)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" :icon="Delete" circle plain size="small" @click="onDelete(r)" />
                </el-tooltip>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div class="modal-center" :class="{ show: modal }" @click.self="modal = false">
        <div class="modal-box" style="max-width: 560px">
          <h3>{{ editingId == null ? '新建公告' : '编辑公告' }}</h3>
          <div class="form-grid" style="margin-top: 14px">
            <div class="full">
              <label>标题<span style="color: var(--rose)">*</span></label>
              <input v-model="form.title" type="text" placeholder="例如：佣金结算周期调整说明" />
            </div>
            <div class="full">
              <label>正文<span style="color: var(--rose)">*</span></label>
              <textarea v-model="form.body" rows="5" placeholder="纯文本或 Markdown" />
            </div>
            <div>
              <label>推送范围</label>
              <select v-model="form.scope">
                <option>全员</option>
                <option>业务员</option>
                <option>部门经理</option>
                <option>黄埔区授权用户</option>
              </select>
            </div>
            <div>
              <label>小程序弹窗</label>
              <select v-model="form.popup">
                <option>否</option>
                <option>是</option>
              </select>
            </div>
            <div v-if="form.popup === '是'" class="full">
              <label>开始时间<span style="color: var(--rose)">*</span></label>
              <input v-model="form.popupStart" type="datetime-local" style="margin-top: 6px; width: 100%; max-width: 320px" />
            </div>
            <div v-if="form.popup === '是'" class="full">
              <label>结束时间<span style="color: var(--rose)">*</span></label>
              <input v-model="form.popupEnd" type="datetime-local" style="margin-top: 6px; width: 100%; max-width: 320px" />
              <p class="hint" style="margin-top: 6px">仅在小程序弹窗选「是」时必填；不同公告的弹窗时间段不可重叠。</p>
            </div>
            <div class="full">
              <label>列表强调色（中文）</label>
              <select v-model="form.statusToneCn">
                <option value="青绿色">青绿色</option>
                <option value="琥珀色">琥珀色</option>
              </select>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 18px; justify-content: flex-end">
            <button type="button" class="btn" @click="modal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onPublish">{{ editingId == null ? '发布' : '保存' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.cell-wrap {
  max-width: 280px;
  word-break: break-word;
}
.hint-sm {
  font-size: 12px;
  color: #64748b;
}
</style>
