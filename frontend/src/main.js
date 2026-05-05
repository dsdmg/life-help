import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'
import './pwa'
import { initializeWebSocket } from './utils/websocket'
import { pushManager } from './bridge'

const pinia = createPinia()

const app = createApp(App)

pushManager.init().then(() => {
  console.log('[App] 推送服务就绪')
}).catch((error) => {
  console.error('[App] 推送服务初始化失败:', error)
})

app.use(pinia)
app.use(router)
app.use(Vant)

app.mount('#app')
initializeWebSocket()
