import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { usePageLoadingStore } from '@/stores/pageLoading'
import { isGuestOnly, requiresAuth } from './routeMeta'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

const MIN_LOADING_MS = 420

router.beforeEach((to, from, next) => {
  const auth = useAuthStore(pinia)
  if (to.fullPath !== from.fullPath) {
    const loading = usePageLoadingStore(pinia)
    loading.begin()
  }

  if (requiresAuth(to) && !auth.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (isGuestOnly(to) && auth.isAuthenticated) {
    next({ name: 'projects' })
    return
  }

  next()
})

router.afterEach(async () => {
  const loading = usePageLoadingStore(pinia)
  const elapsed = Date.now() - loading.startedAt
  const delay = Math.max(0, MIN_LOADING_MS - elapsed)

  if (delay > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, delay))
  }

  loading.end()
})

router.onError(() => {
  const loading = usePageLoadingStore(pinia)
  loading.end()
})
