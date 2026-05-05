import { showToast } from 'vant'
import nativeBridge from './native'

class PushManager {
  constructor() {
    this.listeners = new Map()
    this.initialized = false
  }

  async init() {
    if (this.initialized) return
    
    const isGranted = await nativeBridge.requestNotificationPermission()
    
    if (!isGranted) {
      console.warn('[Push] 用户拒绝通知权限')
      return
    }

    if (nativeBridge.isNative) {
      await this.initNativePush()
    } else {
      await this.initWebPush()
    }

    this.initialized = true
  }

  async initNativePush() {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      
      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] 设备注册成功:', token.value)
        this.sendTokenToServer(token.value)
      })

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        this.handleIncomingNotification(notification)
      })

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        this.handleNotificationTap(action)
      })

      await PushNotifications.register()
    } catch (error) {
      console.error('[Push] 原生推送初始化失败:', error)
    }
  }

  async initWebPush() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_KEY')
      })
      
      await this.sendTokenToServer(JSON.stringify(subscription))
    } catch (error) {
      console.error('[Push] Web Push 初始化失败:', error)
    }
  }

  handleIncomingNotification(notification) {
    const { title, body, data } = notification
    
    showToast({
      message: title || '新消息',
      type: 'primary',
      duration: 3000
    })
    
    this.emit('message', { title, body, data })
  }

  handleNotificationTap(action) {
    const { data } = action.notification
    
    if (data?.url) {
      window.location.href = data.url
    }
  }

  sendTokenToServer(token) {
    fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token, 
        platform: nativeBridge.platform 
      })
    }).catch(error => {
      console.error('[Push] 注册设备令牌失败:', error)
    })
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach(cb => cb(data))
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

export default new PushManager()
