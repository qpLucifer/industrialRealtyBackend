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

const list = ref<AnnouncementRow[]>([])
const modal = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  title: '',
  body: '',
  scope: '全员',
  popup: '否',
  schedule: '立即',
  status: '已发送' as AnnouncementRow['status'],
  statusTone: 'mint' as AnnouncementRow['statusTone'],
})

async function load() {
  const { list: rows } = await fetchAnnouncements()
  list.value = rows
}

function statusClass(t: AnnouncementRow['statusTone']) {
  return t === 'mint' ? 'mint' : 'amber'
}

function openCreate() {
  editingId.value = null
  form.title = ''
  form.body = ''
  form.scope = '全员'
  form.popup = '否'
  form.schedule = '立即'
  form.status = '已发送'
  form.statusTone = 'mint'
  modal.value = true
}

function openEdit(row: AnnouncementRow) {
  editingId.value = row.id
  form.title = row.title
  form.body = row.body || ''
  form.scope = row.scope
  form.popup = row.popup
  form.schedule = row.schedule
  form.status = row.status
  form.statusTone = row.statusTone
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
  const payload = {
    title: form.title.trim(),
    body: form.body.trim(),
    scope: form.scope,
    popup: form.popup,
    schedule: form.schedule,
    status: form.status,
    statusTone: form.statusTone,
  }
  if (editingId.value == null) {
    await publishAnnouncement(payload)
    ElMessage.success('公告已发布')
  } else {
    await updateAnnouncementApi(editingId.value, payload)
    ElMessage.success('公告已更新')
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
            <th>弹窗</th>
            <th>定时</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.title }}</td>
            <td>{{ r.scope }}</td>
            <td>{{ r.popup }}</td>
            <td>{{ r.schedule }}</td>
            <td><span class="tag" :class="statusClass(r.statusTone)">{{ r.status }}</span></td>
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
          <p class="hint">数据写入 announcements 表；小程序端读取列表接口展示。</p>
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
            <div>
              <label>定时发送</label>
              <select v-model="form.schedule">
                <option>立即</option>
                <option>计划中</option>
              </select>
            </div>
            <div>
              <label>状态</label>
              <select v-model="form.status">
                <option value="已发送">已发送</option>
                <option value="计划中">计划中</option>
              </select>
            </div>
            <div>
              <label>状态色调</label>
              <select v-model="form.statusTone">
                <option value="mint">mint</option>
                <option value="amber">amber</option>
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
