<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createSysAdminUser, deleteSysAdminUser, fetchSysAdminUsers, updateSysAdminUser } from '@/api/admin'
import type { SysAdminUserRow } from '@/types/domain'
import { Delete, Edit } from '@element-plus/icons-vue'

const list = ref<SysAdminUserRow[]>([])
const drawer = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  username: '',
  displayName: '',
  roleLine: '',
  avatarUrl: '',
  password: '',
  currentPassword: '',
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
  form.currentPassword = ''
  drawer.value = true
}

function openEdit(row: SysAdminUserRow) {
  editingId.value = row.id
  form.username = row.username
  form.displayName = row.displayName
  form.roleLine = row.roleLine
  form.avatarUrl = row.avatarUrl || ''
  form.password = ''
  form.currentPassword = ''
  drawer.value = true
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
    const row = list.value.find((r) => r.id === editingId.value)
    const hasPwd = Boolean(row?.hasLoginPassword)
    if (hasPwd && !form.currentPassword) {
      ElMessage.warning('该账号已设置登录密码，保存前请在「当前密码」中输入正确密码')
      return
    }
    if (!hasPwd && form.currentPassword) {
      ElMessage.warning('该账号尚未设置登录密码，「当前密码」请留空')
      return
    }
    await updateSysAdminUser(editingId.value, {
      username,
      displayName,
      roleLine,
      avatarUrl: avatarUrl || null,
      password: form.password.trim() || undefined,
      currentPassword: form.currentPassword,
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
  let currentPassword = ''
  if (row.hasLoginPassword) {
    try {
      const { value } = await ElMessageBox.prompt('请输入该用户的当前密码以确认删除', '验证密码', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '当前密码',
        inputValidator: (v) => (String(v || '').length > 0 ? true : '请输入密码'),
      })
      currentPassword = String(value || '')
    } catch {
      return
    }
  } else {
    try {
      const { value } = await ElMessageBox.prompt('该账号未设置登录密码，可直接删除；如需取消请点取消。', '确认', {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        inputType: 'password',
        inputPlaceholder: '留空即可',
        inputValidator: () => true,
      })
      currentPassword = String(value || '')
    } catch {
      return
    }
  }
  try {
    await deleteSysAdminUser(row.id, currentPassword)
    ElMessage.success('已删除')
    await load()
  } catch (e: unknown) {
    const err = e as { message?: string }
    ElMessage.error(err?.message || '删除失败')
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
            <th>已设密码</th>
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
            <td>{{ r.hasLoginPassword ? '是' : '否' }}</td>
            <td>{{ r.createdAt }}</td>
            <td class="table-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" :icon="Edit" circle plain size="small" @click="openEdit(r)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" :icon="Delete" circle plain size="small" @click="onDelete(r)" />
              </el-tooltip>
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
        <div v-if="editingId != null" class="full">
          <label>当前密码<span style="color: var(--rose)">*</span></label>
          <input v-model="form.currentPassword" type="password" maxlength="128" autocomplete="current-password" />
          <p class="hint" style="margin-top: 6px">
            已设置登录密码的账号：须填对才能保存。未设置过密码的账号：请留空。
          </p>
        </div>
        <div class="full">
          <label>{{ editingId == null ? '初始密码' : '新密码（可选）' }}<span v-if="editingId == null" style="color: var(--rose)">*</span></label>
          <input v-model="form.password" type="password" maxlength="128" autocomplete="new-password" />
          <p v-if="editingId != null" class="hint" style="margin-top: 6px">留空表示不修改密码；填写则同时更新为新密码（仍需正确填写当前密码）。</p>
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
</style>
