<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { safeAppRedirect } from '@/lib/safeRedirect'
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
    await router.push(safeAppRedirect(route.query.redirect))
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
    <div class="login-stack">
      <div class="login-brand">
        <div class="login-brand-logo-wrap">
          <img class="login-brand-logo" src="/favicon.svg" alt="鹏基" />
        </div>
        <h1 class="login-brand-title">浙江企鹏工业地产</h1>
        <p class="login-brand-sub">内部管理后台</p>
      </div>
      <div class="login-card">
        <h2>登录</h2>
        <div class="field">
          <label>登录名</label>
          <input v-model="username" type="text" autocomplete="username" placeholder="admin" @keyup.enter="onSubmit" />
        </div>
        <div class="field">
          <label>密码</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </div>
        <p class="hint" style="margin-bottom: 12px">
          默认 <code>admin</code> / <code>Admin123!</code>（请及时在用户管理中修改）。
        </p>
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
  </div>
</template>
