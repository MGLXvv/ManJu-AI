import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { mediaBlobRepository } from './services/media/mediaBlobRepository'
import { installGlobalErrorHandlers } from './services/runtime/installGlobalErrorHandlers'
import { pinia } from './stores'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

const app = createApp(App).use(pinia).use(i18n).use(router)
const uninstallGlobalErrorHandlers = installGlobalErrorHandlers(app)

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    uninstallGlobalErrorHandlers()
    mediaBlobRepository.revokeObjectUrls()
  })
}

app.mount('#app')
