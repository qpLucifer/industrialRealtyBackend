<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { navMeta } from '@/router/routes'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = computed(() => useRoute())

async function onUserMenu(command: string) {
  if (command !== 'logout') return
  try {
    await ElMessageBox.confirm('确定退出登录？', '退出登录', { type: 'warning', confirmButtonText: '退出', cancelButtonText: '取消' })
  } catch {
    return
  }
  await auth.logout()
  await router.push({ name: 'login', query: {} })
}

const pageTitle = computed(() => {
  const name = route.value.name?.toString() ?? 'dashboard'
  return navMeta[name]?.title ?? '数据总览'
})

const pageCrumb = computed(() => {
  const name = route.value.name?.toString() ?? 'dashboard'
  return navMeta[name]?.crumb ?? ''
})

const navPrimary = { to: '/app/dashboard', name: 'dashboard', label: '数据总览' }

const navGroups: { section: string; items: { to: string; name: string; label: string }[] }[] = [
  {
    section: '组织 / 安全',
    items: [
      { to: '/app/staff', name: 'staff', label: '员工与账号' },
      { to: '/app/whitelist', name: 'whitelist', label: '手机号白名单' },
      { to: '/app/regions', name: 'regions', label: '区域名称' },
      { to: '/app/code-master', name: 'code-master', label: '代码字典' },
      { to: '/app/sys-users', name: 'sys-users', label: '用户管理' },
    ],
  },
  {
    section: '业务',
    items: [
      { to: '/app/properties', name: 'properties', label: '房源管理' },
      { to: '/app/property-privacy', name: 'property-privacy', label: '房源隐私' },
      { to: '/app/audit', name: 'audit', label: '审核中心' },
      { to: '/app/customers', name: 'customers', label: '客户统筹' },
      { to: '/app/video-faq', name: 'video-faq', label: '视频 FAQ' },
      { to: '/app/viewings', name: 'viewings', label: '带看 / 成交' },
      { to: '/app/announce', name: 'announce', label: '公告通知' },
      { to: '/app/land-auction', name: 'land-auction', label: '工业土地出售' },
    ],
  },
  {
    section: '审计',
    items: [
      { to: '/app/logs', name: 'logs', label: '日志查询' },
      { to: '/app/settings', name: 'settings', label: '系统设置' },
      // { to: '/app/future', name: 'future', label: '扩展预留' },
    ],
  },
]

function isActive(name: string) {
  return route.value.name === name
}
</script>

<template>
  <div class="layout-app">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-row">
          <div class="brand-logo-wrap">
            <img class="brand-logo" src="/favicon.svg" alt="鹏基" />
          </div>
          <div class="brand-text">
            <div class="brand-title">浙江企鹏工业地产</div>
            <div class="brand-sub">内部管理后台</div>
          </div>
        </div>
      </div>

      <RouterLink
        :to="navPrimary.to"
        class="nav-btn"
        :class="{ active: isActive(navPrimary.name) }"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
        {{ navPrimary.label }}
      </RouterLink>

      <template v-for="group in navGroups" :key="group.section">
        <div class="nav-section">{{ group.section }}</div>
        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          :to="item.to"
          class="nav-btn"
          :class="{ active: isActive(item.name) }"
        >
          <svg
            v-if="item.name === 'staff'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'whitelist'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'sys-users'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'regions'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'properties'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <svg
            v-else-if="item.name === 'property-privacy'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'audit'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <svg
            v-else-if="item.name === 'customers'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 14H5V5h14v12z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'video-faq'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'viewings'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'announce'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'logs'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A7 7 0 0119 12a7 7 0 01-7 7 7 7 0 01-7-7 7 7 0 013.58-6.59L6.17 5.17A9 9 0 103 12c0 2.65 1.17 5.03 3.17 6.83z"
            />
          </svg>
          <svg
            v-else-if="item.name === 'settings'"
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.5.5 0 00.12-.61l-1.92-3.32a.5.5 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.5.5 0 0015.5 2h-3.84a.5.5 0 00-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.5.5 0 00-.59.22l-1.92 3.32a.5.5 0 00.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.93l-2.03 1.58a.5.5 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"
            />
          </svg>
          <svg
            v-else
            width="18"
            height="18"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M4 6H2v14a2 2 0 002 2h14v-2H4V6zm16-4H8a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"
            />
          </svg>
          {{ item.label }}
        </RouterLink>
      </template>

      <div style="flex: 1" />
      <p class="hint" style="padding: 12px 22px">
        导出默认关闭 · 敏感字段按角色掩码 · 全量审计日志保留 ≥180 天
      </p>
    </aside>

    <div class="main">
      <header class="topstrip">
        <div>
          <h1>{{ pageTitle }}</h1>
          <div class="crumb">{{ pageCrumb }}</div>
        </div>
        <el-dropdown trigger="click" @command="onUserMenu">
          <div class="user-pill" role="button" tabindex="0" title="账户菜单">
            <img
              v-if="auth.user?.avatarUrl"
              class="avatar avatar-img"
              :src="auth.user.avatarUrl"
              alt=""
              referrerpolicy="no-referrer"
            />
            <div v-else class="avatar" aria-hidden="true" />
            <div style="line-height: 16px;">
              <div style="font-weight: 700; font-size: 13px">{{ auth.user?.displayName ?? '—' }}</div>
              <div style="font-size: 11px; color: var(--muted)">{{ auth.user?.roleLine ?? '' }}</div>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>

      <div class="content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
a.nav-btn {
  text-decoration: none;
}

.user-pill {
  cursor: pointer;
  outline: none;
}

.user-pill:hover {
  border-color: var(--brand-border);
}
</style>
