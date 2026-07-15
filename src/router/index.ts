import { createRouter, createWebHistory } from 'vue-router'
import { resolveAuthRouteAccess } from '@/features/auth/authRouteAccessState'
import { resolveEditorRouteCapability } from '@/features/editor/editorCapabilityState'
import { isEditorStepRouteName, resolveEditorRouteGuard } from '@/features/editor/editorRouteGuardState'
import { createRouteLoadingTracker, resolveRouteLoadingDelay } from '@/features/navigation/routeLoadingState'
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
const routeLoadingTracker = createRouteLoadingTracker<object>()

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore(pinia)
  const loading = usePageLoadingStore(pinia)
  const uiFeedback = useUiFeedbackStore(pinia)

  if (to.fullPath !== from.fullPath) {
    const token = loading.begin()
    routeLoadingTracker.register(to, { token, startedAt: loading.startedAt })
  }

  const authAccess = resolveAuthRouteAccess(
    {
      requiresAuth: requiresAuth(to),
      guestOnly: isGuestOnly(to),
    },
    auth,
  )

  if (authAccess.action === 'login') {
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

  if (authAccess.action === 'projects') {
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
    const capabilityResult = resolveEditorRouteCapability(to.name)
    if (!capabilityResult.ok) {
      uiFeedback.showToast(capabilityResult.message, { tone: 'info' })
      next({
        name: capabilityResult.redirectRouteName,
        params: to.params,
        query: to.query,
        replace: true,
      })
      return
    }

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
  const record = routeLoadingTracker.take(to)
  if (!record) {
    return
  }

  const delay = resolveRouteLoadingDelay({
    startedAt: record.startedAt,
    now: Date.now(),
    minimumMs: MIN_LOADING_MS,
  })

  if (delay > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, delay))
  }

  loading.end(record.token)
})

router.onError((error, to) => {
  const loading = usePageLoadingStore(pinia)
  const record = to ? routeLoadingTracker.take(to) : undefined
  if (record) {
    loading.end(record.token)
  }

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
