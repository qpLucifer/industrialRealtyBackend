<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  const u = username.value.trim().toLowerCase()
  const p = password.value
  if (!u || !p) {
    ElMessage.warning('请输入登录名和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(u, p)
    const exp = auth.sessionExpiresAt
    ElMessage.success(
      exp ? `登录成功，会话将于 ${new Date(exp).toLocaleString()} 过期` : '登录成功',
    )
    const redirect = (route.query.redirect as string) || '/app/dashboard'
    await router.push(redirect)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <h2>管理后台登录</h2>
      <p>使用「用户管理」中维护的 <strong>admin</strong> 类型账号登录；密码与后台保存一致。</p>
      <p class="hint" style="margin-bottom: 12px">
        全新库执行 <code>npm run db:reset</code> 后，默认 <code>admin</code> / <code>Admin123!</code>（请及时在用户管理中修改）。
      </p>
      <div class="field">
        <label>登录名</label>
        <input v-model="username" type="text" autocomplete="username" placeholder="admin" @keyup.enter="onSubmit" />
      </div>
      <div class="field">
        <label>密码</label>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="onSubmit" />
      </div>
      <button
        type="button"
        class="btn btn-primary"
        style="width: 100%; padding: 12px; margin-top: 8px; border-radius: 12px"
        :disabled="loading"
        @click="onSubmit"
      >
        {{ loading ? '登录中…' : '登录' }}
      </button>
    </div>
  </div>
</template>
