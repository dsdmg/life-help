import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import router from './router'

registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[PWA] Service Worker 已就绪，应用支持离线访问')
  },
  onNeedRefresh() {
    console.log('[PWA] 检测到新版本，等待刷新页面生效')
  },
  onRegisteredSW(swScriptUrl, registration) {
    console.log('[PWA] Service Worker 注册成功:', swScriptUrl, registration)
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker 注册失败:', error)
  }
})

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Vant)

app.mount('#app')
