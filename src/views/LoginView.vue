<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

async function onEnter() {
  await auth.login()
  ElMessage.success('已登录 · 角色：超级管理员 · 全区域')
  const redirect = (route.query.redirect as string) || '/app/dashboard'
  await router.push(redirect)
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <h2>管理后台登录</h2>
      <p>企业内网 · 支持账号密码 / 企业微信扫码（原型占位）</p>
      <div class="field">
        <label>账号</label>
        <input type="text" value="admin@company.internal" readonly />
      </div>
      <div class="field">
        <label>密码</label>
        <input type="password" value="password" readonly />
      </div>
      <button type="button" class="btn btn-primary" style="width: 100%; padding: 12px; margin-top: 8px; border-radius: 12px" @click="onEnter">
        登录
      </button>
      <p class="hint" style="margin-top: 16px">生产环境建议启用 MFA · IP 白名单 · 操作水印。</p>
    </div>
  </div>
</template>
