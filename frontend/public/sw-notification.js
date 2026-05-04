const DEFAULT_NOTIFICATION_URL = '/home'

const resolveNotificationUrl = (url) => {
  try {
    return new URL(url || DEFAULT_NOTIFICATION_URL, self.location.origin).href
  } catch {
    return new URL(DEFAULT_NOTIFICATION_URL, self.location.origin).href
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = resolveNotificationUrl(event.notification?.data?.url)

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    const appClient = windowClients.find((client) => {
      try {
        return new URL(client.url).origin === self.location.origin
      } catch {
        return false
      }
    })

    if (appClient) {
      if ('focus' in appClient) {
        await appClient.focus()
      }

      if ('navigate' in appClient && appClient.url !== targetUrl) {
        await appClient.navigate(targetUrl)
      }

      return
    }

    if (self.clients.openWindow) {
      const openedClient = await self.clients.openWindow(targetUrl)

      if (openedClient && 'focus' in openedClient) {
        await openedClient.focus()
      }
    }
  })())
})
