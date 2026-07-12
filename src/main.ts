import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { mediaBlobRepository } from './services/media/mediaBlobRepository'
import { installGlobalErrorHandlers } from './services/runtime/installGlobalErrorHandlers'
import { installRuntimeResourceDiagnostics } from './services/runtime/runtimeResourceDiagnostics'
import { pinia } from './stores'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

const app = createApp(App).use(pinia).use(i18n).use(router)
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
