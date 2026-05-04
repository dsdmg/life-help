import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

export const pwaNeedRefresh = ref(false)
export const pwaOfflineReady = ref(false)

let swRegistration: ServiceWorkerRegistration | null = null

const updateSW = registerSW({
  immediate: true,
  onOfflineReady() {
    pwaOfflineReady.value = true
    console.log('[PWA] Service Worker 已就绪，应用支持离线访问')
  },
  onNeedRefresh() {
    pwaNeedRefresh.value = true
    console.log('[PWA] 检测到新版本，等待刷新页面生效')
  },
  onRegisteredSW(swScriptUrl, registration) {
    swRegistration = registration ?? null
    console.log('[PWA] Service Worker 注册成功:', swScriptUrl, registration)
  },
  onRegisterError(error) {
    console.error('[PWA] Service Worker 注册失败:', error)
  }
})

const getRegistration = async () => {
  if (swRegistration) {
    return swRegistration
  }

  if (!('serviceWorker' in navigator)) {
    return null
  }

  swRegistration = await navigator.serviceWorker.getRegistration()
  return swRegistration
}

export const checkForPwaUpdate = async () => {
  const registration = await getRegistration()

  if (!registration) {
    return {
      checked: false,
      hasUpdate: false,
      message: 'Service Worker 尚未就绪'
    }
  }

  await registration.update()

  if (registration.waiting || pwaNeedRefresh.value) {
    return {
      checked: true,
      hasUpdate: true,
      message: '检测到新版本，准备刷新页面'
    }
  }

  return {
    checked: true,
    hasUpdate: false,
    message: '当前已是最新版本'
  }
}

export const applyPwaUpdate = async () => {
  const registration = await getRegistration()

  if (!registration || (!registration.waiting && !pwaNeedRefresh.value)) {
    return false
  }

  await updateSW(true)
  return true
}
