import type { RouteRecordRaw } from 'vue-router'

export const navMeta: Record<
  string,
  {
    title: string
    crumb: string
  }
> = {
  dashboard: { title: '数据总览', crumb: '全局 KPI · 区域分布 · 活跃度' },
  staff: { title: '员工与账号', crumb: '部门 · 职位 · 区域绑定 · 账号状态' },
  whitelist: { title: '手机号白名单', crumb: '小程序准入双重校验' },
  regions: { title: '区域名称', crumb: '业务区域名称（与员工负责区、房源区域一致）' },
  'code-master': { title: '代码字典', crumb: '职位 · 部门 · 角色 · 房源类型与状态等下拉维护' },
  properties: { title: '房源管理', crumb: '全字段维护 · 审核状态' },
  'property-privacy': { title: '房源隐私', crumb: '员工 × 房源 · 隐私查看与小程序编辑授权' },
  audit: { title: '审核中心', crumb: '待审队列 · 风控' },
  customers: { title: '客户统筹', crumb: '跟进表 · ABC 分级 · 系统提醒' },
  'video-faq': { title: '视频 FAQ', crumb: '客户问题采集 · 短视频库 · 小程序可搜' },
  viewings: { title: '带看 / 成交', crumb: '台账 · 财务预留字段' },
  announce: { title: '公告通知', crumb: '范围推送 · 弹窗策略' },
  'land-auction': { title: '工业土地出售', crumb: '挂拍预告 · 在拍 · 成交统计' },
  logs: { title: '日志审计', crumb: '房源 / 客户 / 账号溯源' },
  settings: { title: '系统设置', crumb: '审核 · 脱敏 · 导出 · 自定义预留' },
  'sys-users': { title: '用户管理', crumb: '后台登录账号 · 增删改查' },
  future: { title: '扩展预留', crumb: '财务 / 打卡 / 招商等扩展接口清单' },
}

export const appRoutes: RouteRecordRaw[] = [
  { path: '/', redirect: '/app/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/app',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/app/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'staff', name: 'staff', component: () => import('@/views/StaffView.vue') },
      { path: 'whitelist', name: 'whitelist', component: () => import('@/views/WhitelistView.vue') },
      { path: 'regions', name: 'regions', component: () => import('@/views/RegionsView.vue') },
      { path: 'code-master', name: 'code-master', component: () => import('@/views/CodeMasterView.vue') },
      { path: 'properties', name: 'properties', component: () => import('@/views/PropertiesView.vue') },
      {
        path: 'property-privacy',
        name: 'property-privacy',
        component: () => import('@/views/PropertyPrivacyView.vue'),
      },
      { path: 'audit', name: 'audit', component: () => import('@/views/AuditView.vue') },
      { path: 'customers', name: 'customers', component: () => import('@/views/CustomersView.vue') },
      { path: 'video-faq', name: 'video-faq', component: () => import('@/views/VideoFaqView.vue') },
      { path: 'viewings', name: 'viewings', component: () => import('@/views/ViewingsView.vue') },
      { path: 'announce', name: 'announce', component: () => import('@/views/AnnounceView.vue') },
      { path: 'land-auction', name: 'land-auction', component: () => import('@/views/LandAuctionView.vue') },
      { path: 'logs', name: 'logs', component: () => import('@/views/LogsView.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
      { path: 'sys-users', name: 'sys-users', component: () => import('@/views/SysAdminUsersView.vue') },
      { path: 'future', name: 'future', component: () => import('@/views/FutureView.vue') },
    ],
  },
]
