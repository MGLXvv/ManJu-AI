import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { mediaBlobRepository } from './services/media/mediaBlobRepository'
import { installGlobalErrorHandlers } from './services/runtime/installGlobalErrorHandlers'
import { reportRuntimeError } from './services/runtime/runtimeDiagnostics'
import { installRuntimeResourceDiagnostics } from './services/runtime/runtimeResourceDiagnostics'
import { pinia } from './stores'
import { useAuthStore } from './stores/auth'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

const bootstrap = async (): Promise<void> => {
  const app = createApp(App).use(pinia).use(i18n)
  const auth = useAuthStore(pinia)

  try {
    await auth.restoreSession()
  } catch (error) {
    reportRuntimeError(error, {
      code: 'AUTH_SESSION_RESTORE_FAILED',
      category: 'network',
      message: '登录状态校验失败，请检查网络后重试',
    })
  }

  app.use(router)

  const uninstallGlobalErrorHandlers = installGlobalErrorHandlers(app)
  const uninstallRuntimeResourceDiagnostics = installRuntimeResourceDiagnostics()

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      uninstallGlobalErrorHandlers()
      uninstallRuntimeResourceDiagnostics()
      mediaBlobRepository.revokeObjectUrls()
    })
  }

  app.mount('#app')
}

void bootstrap()
