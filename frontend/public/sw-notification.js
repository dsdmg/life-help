self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetPath = event.notification?.data?.url || '/home'

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    for (const client of windowClients) {
      if ('navigate' in client) {
        await client.navigate(targetPath)
      }

      if ('focus' in client) {
        await client.focus()
      }

      return
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow(targetPath)
    }
  })())
})
