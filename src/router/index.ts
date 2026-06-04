import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores'
import { usePageLoadingStore } from '@/stores/pageLoading'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

const MIN_LOADING_MS = 420

router.beforeEach((to, from, next) => {
  if (to.fullPath !== from.fullPath) {
    const loading = usePageLoadingStore(pinia)
    loading.begin()
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
