import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'

import App from './App.vue'
import router from './router'
import './pwa'

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Vant)

app.mount('#app')
