import { showToast } from 'vant'

const DEFAULT_ICON = '/logo/logo192.png'
const DEFAULT_URL = '/home'

export const sendAppNotification = async ({
  title,
  body,
  tag = 'app-notification',
  data = {}
}) => {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  const notificationOptions = {
    body,
    icon: DEFAULT_ICON,
    badge: DEFAULT_ICON,
    tag,
    renotify: true,
    data: {
      url: DEFAULT_URL,
      ...data,
      createdAt: Date.now()
    }
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.ready

      if (registration) {
        await registration.showNotification(title, notificationOptions)
        return true
      }
    } catch (error) {
      console.error('[Notification] Service Worker 通知发送失败:', error)
    }
  }

  try {
    const notification = new Notification(title, notificationOptions)

    notification.onclick = () => {
      window.focus()
      window.location.href = notificationOptions.data.url || DEFAULT_URL
      notification.close()
    }

    return true
  } catch (error) {
    console.error('[Notification] 普通通知发送失败:', error)
    showToast('系统通知发送失败，请检查浏览器通知设置')
    return false
  }
}
