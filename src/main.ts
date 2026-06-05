import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { pinia } from './stores'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

createApp(App).use(pinia).use(i18n).use(router).mount('#app')
