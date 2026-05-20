import { createRouter, createWebHistory } from 'vue-router'
import { appRoutes } from './routes'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (auth.isAuthenticated && !auth.user) {
    try {
      await auth.hydrateUser()
    } catch {
      await auth.logout()
      return { name: 'login', query: { redirect: to.fullPath } }
    }
  }
  return true
})

export default router
