import { createRouter, createWebHistory } from 'vue-router'
import { isEditorStepRouteName, resolveEditorRouteGuard } from '@/features/editor/editorRouteGuardState'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { usePageLoadingStore } from '@/stores/pageLoading'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import { isGuestOnly, requiresAuth } from './routeMeta'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

const MIN_LOADING_MS = 420

router.beforeEach(async (to, from, next) => {
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

  if (isEditorStepRouteName(to.name)) {
    const projectId = String(to.params.projectId ?? '')
    if (projectId) {
      const editorStore = useEditorStore(pinia)
      const uiFeedback = useUiFeedbackStore(pinia)

      if (editorStore.currentProjectId !== projectId || !editorStore.draft) {
        await editorStore.loadDraft(projectId)
      }

      const guardResult = resolveEditorRouteGuard(to.name, editorStore.draft)
      if (!guardResult.ok) {
        uiFeedback.showToast(guardResult.message, { tone: 'error' })
        next({
          name: guardResult.redirectRouteName,
          params: to.params,
          query: to.query,
          replace: true,
        })
        return
      }
    }
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
