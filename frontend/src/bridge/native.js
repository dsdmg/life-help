class NativeBridge {
  constructor() {
    this.isNative = this.checkNativeEnv()
    this.platform = this.getPlatform()
  }

  checkNativeEnv() {
    return !!(window.Capacitor || window.webkit?.messageHandlers)
  }

  getPlatform() {
    if (window.Capacitor) {
      return window.Capacitor.platform
    }
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios'
    if (ua.includes('android')) return 'android'
    return 'web'
  }

  async getDeviceToken() {
    if (!this.isNative) return null
    
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const result = await PushNotifications.register()
      return result.token || null
    } catch (error) {
      console.error('[Bridge] 获取设备令牌失败:', error)
      return null
    }
  }

  async requestNotificationPermission() {
    if (!this.isNative) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const result = await PushNotifications.requestPermission()
      return result.granted
    } catch (error) {
      console.error('[Bridge] 请求通知权限失败:', error)
      return false
    }
  }
}

export default new NativeBridge()
