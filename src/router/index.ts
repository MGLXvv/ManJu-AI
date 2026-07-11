import { createRouter, createWebHistory } from 'vue-router'
import { isEditorStepRouteName, resolveEditorRouteGuard } from '@/features/editor/editorRouteGuardState'
import { startEditorWorkspacePersistenceSync } from '@/services/editor/editorWorkspacePersistenceSync'
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

startEditorWorkspacePersistenceSync(pinia)

const MIN_LOADING_MS = 420

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore(pinia)
  const loading = usePageLoadingStore(pinia)
  const uiFeedback = useUiFeedbackStore(pinia)

  if (to.fullPath !== from.fullPath) {
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

  if (isEditorStepRouteName(from.name) && to.fullPath !== from.fullPath) {
    const editorStore = useEditorStore(pinia)
    if (editorStore.hasUnsavedChanges) {
      const saved = await editorStore.flushPendingSave('navigation')
      if (!saved) {
        uiFeedback.showToast(
          editorStore.hasSaveConflict
            ? '草稿已在其他位置更新，请处理版本冲突后再离开'
            : '草稿保存失败，请重试后再离开',
          { tone: 'error' },
        )
        loading.end()
        next(false)
        return
      }
    }
  }

  if (isEditorStepRouteName(to.name)) {
    const projectId = String(to.params.projectId ?? '')
    if (projectId) {
      const editorStore = useEditorStore(pinia)

      try {
        if (editorStore.currentProjectId !== projectId || !editorStore.draft) {
          await editorStore.loadDraft(projectId)
        }
      } catch {
        uiFeedback.showToast('项目草稿加载失败，请稍后再试', { tone: 'error' })
        next({
          name: 'projects',
          replace: true,
        })
        return
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
