import { reactive } from 'vue'
import { showToast } from 'vant'
import { sendAppNotification } from './notification'
import axios from '@/utils/axios'

const HEARTBEAT_INTERVAL = 25000
const RECONNECT_INTERVAL = 5000
const LAST_MESSAGE_ID_KEY = 'ws_last_message_id'

let socket = null
let heartbeatTimer = null
let reconnectTimer = null
let initialized = false
let syncingMissedMessages = false

export const websocketState = reactive({
  status: '未连接',
  connected: false,
  clientId: '',
  username: '',
  lastMessage: '',
  lastMessageId: Number.parseInt(localStorage.getItem(LAST_MESSAGE_ID_KEY) || '0', 10) || 0,
  lastMessageSender: '',
  lastMessageAt: '',
  lastPongAt: '',
  lastError: ''
})

const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const token = localStorage.getItem('token')
  const wsUrl = new URL(`${protocol}//${window.location.host}/ws`)

  if (token) {
    wsUrl.searchParams.set('token', token)
  }

  return wsUrl.toString()
}

const updateConnectionState = (connected, status) => {
  websocketState.connected = connected
  websocketState.status = status
}

const updateLastMessageState = (message) => {
  const messageId = Number.parseInt(message.id, 10)

  if (!Number.isNaN(messageId) && messageId > 0) {
    websocketState.lastMessageId = messageId
    localStorage.setItem(LAST_MESSAGE_ID_KEY, String(messageId))
  }

  websocketState.lastMessage = message.message || ''
  websocketState.lastMessageSender = message.sender || '系统'
  websocketState.lastMessageAt = message.timestamp || new Date().toISOString()
}

const clearHeartbeat = () => {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const startHeartbeat = () => {
  clearHeartbeat()
  heartbeatTimer = window.setInterval(() => {
    sendWebSocketMessage('ping')
  }, HEARTBEAT_INTERVAL)
}

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return
  }

  updateConnectionState(false, '重连中')
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
  }, RECONNECT_INTERVAL)
}

const notifyPushMessage = (message, silent = false) => {
  updateLastMessageState(message)

  if (silent) {
    return
  }

  sendAppNotification({
    title: 'Trade Mobile 推送消息',
    body: websocketState.lastMessage,
    tag: 'ws-push-message',
    data: {
      source: 'websocket-push',
      sender: websocketState.lastMessageSender
    }
  }).then((sent) => {
    if (!sent) {
      showToast(`收到推送：${websocketState.lastMessage}`)
    }
  })
}

const syncMissedMessages = async () => {
  if (syncingMissedMessages) {
    return
  }

  syncingMissedMessages = true

  try {
    const response = await axios.get('/api/push-messages', {
      params: {
        after_id: websocketState.lastMessageId || 0
      }
    })

    const messages = Array.isArray(response.data) ? response.data : []
    messages.forEach((message) => {
      notifyPushMessage(message)
    })
  } catch (error) {
    websocketState.lastError = '同步漏掉的推送失败'
  } finally {
    syncingMissedMessages = false
  }
}

const handleAppResume = () => {
  if (document.visibilityState === 'hidden') {
    return
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    refreshWebSocketConnection()
    return
  }

  syncMissedMessages()
}

const handleSocketMessage = (event) => {
  let payload

  try {
    payload = JSON.parse(event.data)
  } catch (error) {
    websocketState.lastError = '收到无法解析的消息'
    return
  }

  if (payload.type === 'connection_ack') {
    websocketState.clientId = payload.clientId || ''
    websocketState.username = payload.username || ''
    updateConnectionState(true, '已连接')
    syncMissedMessages()
    return
  }

  if (payload.type === 'pong') {
    websocketState.lastPongAt = payload.timestamp || new Date().toISOString()
    return
  }

  if (payload.type === 'push_message') {
    notifyPushMessage(payload)
    return
  }

  if (payload.type === 'error' || payload.type === 'disconnect_notice') {
    websocketState.lastError = payload.message || 'WebSocket 发生异常'
    showToast(websocketState.lastError)
  }
}

export const connectWebSocket = () => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket
  }

  updateConnectionState(false, '连接中')
  websocketState.lastError = ''

  socket = new WebSocket(getWebSocketUrl())

  socket.addEventListener('open', () => {
    updateConnectionState(true, '已连接')
    startHeartbeat()
  })

  socket.addEventListener('message', handleSocketMessage)

  socket.addEventListener('close', () => {
    clearHeartbeat()
    socket = null
    scheduleReconnect()
  })

  socket.addEventListener('error', () => {
    websocketState.lastError = 'WebSocket 连接异常'
  })

  return socket
}

export const initializeWebSocket = () => {
  if (initialized) {
    return
  }

  initialized = true
  window.addEventListener('online', handleAppResume)
  window.addEventListener('pageshow', handleAppResume)
  document.addEventListener('visibilitychange', handleAppResume)
  connectWebSocket()
}

export const sendWebSocketMessage = (type, payload = {}) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    websocketState.lastError = 'WebSocket 未连接'
    return false
  }

  socket.send(JSON.stringify({ type, ...payload }))
  return true
}

export const requestPushMessage = (message) => {
  const content = String(message || '').trim()

  if (!content) {
    websocketState.lastError = '推送内容不能为空'
    return false
  }

  return sendWebSocketMessage('request_push', { message: content })
}

export const refreshWebSocketConnection = () => {
  if (socket) {
    clearHeartbeat()
    socket.close()
    socket = null
  } else {
    connectWebSocket()
  }
}
