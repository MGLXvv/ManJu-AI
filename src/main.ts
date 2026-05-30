import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './assets/iconfont/dist-iconfont/manju-icons.css'
import './styles/index.scss'

createApp(App).use(createPinia()).use(router).mount('#app')
