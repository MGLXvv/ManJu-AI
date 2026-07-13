import { createRouter, createWebHistory } from 'vue-router'
import { isEditorStepRouteName, resolveEditorRouteGuard } from '@/features/editor/editorRouteGuardState'
import { startEditorWorkspacePersistenceSync } from '@/services/editor/editorWorkspacePersistenceSync'
import { attemptChunkLoadRecovery, clearChunkLoadRecoveryMarker } from '@/services/runtime/chunkLoadRecovery'
import { reportRuntimeError } from '@/services/runtime/runtimeDiagnostics'
import { pinia } from '@/stores'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { usePageLoadingStore } from '@/stores/pageLoading'
import { useUiFeedbackStore } from '@/stores/uiFeedback'
import { isGuestOnly, requiresAuth, resolveRouteTitle } from './routeMeta'
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
    const reason = auth.consumeSessionIssue()
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
        ...(reason ? { reason } : {}),
      },
    })
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
          editorStore.hasSaveConflict ? '草稿已在其他位置更新，请处理版本冲突后再离开' : '草稿保存失败，请重试后再离开',
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
      } catch (error) {
        reportRuntimeError(error, {
          code: 'EDITOR_WORKSPACE_LOAD_FAILED',
          category: 'route',
          message: '项目草稿加载失败',
          context: { projectId },
        })
        loading.end()
        next({
          name: 'project-unavailable',
          params: { projectId },
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

router.afterEach(async (to) => {
  clearChunkLoadRecoveryMarker()

  if (typeof document !== 'undefined') {
    document.title = resolveRouteTitle(to)
  }

  const loading = usePageLoadingStore(pinia)
  const elapsed = Date.now() - loading.startedAt
  const delay = Math.max(0, MIN_LOADING_MS - elapsed)

  if (delay > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, delay))
  }

  loading.end()
})

router.onError((error, to) => {
  const loading = usePageLoadingStore(pinia)
  loading.end()

  if (attemptChunkLoadRecovery(error, { routeKey: to?.fullPath })) {
    return
  }

  reportRuntimeError(error, {
    code: 'ROUTE_NAVIGATION_FAILED',
    category: 'route',
    message: '页面资源加载失败，请重新加载后重试',
    context: { route: to?.fullPath },
  })
})
