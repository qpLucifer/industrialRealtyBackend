<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createSysAdminUser, deleteSysAdminUser, fetchSysAdminUsers, updateSysAdminUser, uploadOssFile } from '@/api/admin'
import type { SysAdminUserRow } from '@/types/domain'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { formatBeijingDisplay } from '@/lib/beijingTime'
import { Delete, Edit } from '@element-plus/icons-vue'

const list = ref<SysAdminUserRow[]>([])
const drawer = ref(false)
const editingId = ref<number | null>(null)
const uploadingAvatar = ref(false)

const form = reactive({
  username: '',
  displayName: '',
  roleLine: '',
  avatarUrl: '',
  password: '',
})

async function load() {
  const { list: rows } = await fetchSysAdminUsers()
  list.value = rows.map((r) => ({
    ...r,
    hasLoginPassword: Boolean(r.hasLoginPassword),
  }))
}

onMounted(load)

function openNew() {
  editingId.value = null
  form.username = ''
  form.displayName = ''
  form.roleLine = ''
  form.avatarUrl = ''
  form.password = ''
  drawer.value = true
}

function openEdit(row: SysAdminUserRow) {
  editingId.value = row.id
  form.username = row.username
  form.displayName = row.displayName
  form.roleLine = row.roleLine
  form.avatarUrl = row.avatarUrl || ''
  form.password = ''
  drawer.value = true
}

async function onAvatarPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingAvatar.value = true
  try {
    const { url } = await uploadOssFile(file, 'sys-admin-avatars')
    form.avatarUrl = url
    ElMessage.success('头像已上传')
  } catch {
    /* global http interceptor shows API error */
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

async function onSave() {
  const username = form.username.trim().toLowerCase()
  const displayName = form.displayName.trim()
  const roleLine = form.roleLine.trim()
  const avatarUrl = form.avatarUrl.trim()
  if (!username) {
    ElMessage.warning('请填写登录名')
    return
  }
  if (!displayName || !roleLine) {
    ElMessage.warning('请填写显示名与角色描述')
    return
  }
  if (editingId.value == null) {
    if (form.password.length < 6) {
      ElMessage.warning('新建用户须设置初始密码（至少 6 位）')
      return
    }
    await createSysAdminUser({
      username,
      password: form.password,
      displayName,
      roleLine,
      avatarUrl: avatarUrl || null,
    })
    ElMessage.success('已新增后台用户')
  } else {
    await updateSysAdminUser(editingId.value, {
      username,
      displayName,
      roleLine,
      avatarUrl: avatarUrl || null,
      password: form.password.trim() || undefined,
    })
    ElMessage.success('已保存')
  }
  drawer.value = false
  await load()
}

async function onDelete(row: SysAdminUserRow) {
  try {
    await ElMessageBox.confirm(`确定删除后台用户「${row.displayName}」(${row.username})？`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteSysAdminUser(row.id)
    ElMessage.success('已删除')
    await load()
  } catch {
    /* global http interceptor shows API error */
  }
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openNew">＋ 新增后台用户</button>
      <button type="button" class="btn" @click="load">刷新</button>
    </div>
    <div class="card" style="padding: 0; overflow-x: auto">
      <table class="data">
        <thead>
          <tr>
            <th>ID</th>
            <th>登录名</th>
            <th>显示名</th>
            <th>角色描述</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.id }}</td>
            <td>{{ r.username }}</td>
            <td>{{ r.displayName }}</td>
            <td class="cell-wrap">{{ r.roleLine }}</td>
            <td>{{ formatBeijingDisplay(r.createdAt) || r.createdAt || '—' }}</td>
            <td class="table-actions">
              <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(r)" />
              <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(r)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-drawer v-model="drawer" :title="editingId == null ? '新增后台用户' : '编辑后台用户'" size="min(480px, 92vw)" destroy-on-close>
      <div class="form-grid">
        <div>
          <label>登录名<span style="color: var(--rose)">*</span></label>
          <input v-model="form.username" type="text" maxlength="64" autocomplete="username" :disabled="editingId != null" />
        </div>
        <div class="full">
          <label>显示名<span style="color: var(--rose)">*</span></label>
          <input v-model="form.displayName" type="text" maxlength="128" />
        </div>
        <div class="full">
          <label>角色描述<span style="color: var(--rose)">*</span></label>
          <input v-model="form.roleLine" type="text" maxlength="255" placeholder="例：超级管理员 · 全区域" />
        </div>
        <div class="full">
          <label>头像 URL（可选）</label>
          <input v-model="form.avatarUrl" type="text" maxlength="512" />
        </div>
        <div class="full">
          <label>上传头像</label>
          <input type="file" accept="image/*" :disabled="uploadingAvatar" @change="onAvatarPick" />
          <div v-if="form.avatarUrl" class="avatar-preview-wrap">
            <img :src="form.avatarUrl" alt="" class="avatar-preview" referrerpolicy="no-referrer" />
          </div>
        </div>
        <div class="full">
          <label>{{ editingId == null ? '初始密码' : '新密码（可选）' }}<span v-if="editingId == null" style="color: var(--rose)">*</span></label>
          <input v-model="form.password" type="password" maxlength="128" autocomplete="new-password" />
          <p v-if="editingId != null" class="hint" style="margin-top: 6px">留空表示不修改密码。</p>
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 20px">
        <button type="button" class="btn btn-primary" @click="onSave">{{ editingId == null ? '创建' : '保存' }}</button>
        <button type="button" class="btn" @click="drawer = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>

<style scoped>
.cell-wrap {
  max-width: 280px;
  word-break: break-word;
}
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}
.avatar-preview-wrap {
  margin-top: 10px;
}
.avatar-preview {
  width: 88px;
  height: 88px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #f1f5f9;
}
</style>
