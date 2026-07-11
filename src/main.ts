import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { mediaBlobRepository } from './services/media/mediaBlobRepository'
import { pinia } from './stores'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => mediaBlobRepository.revokeObjectUrls())
}

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
