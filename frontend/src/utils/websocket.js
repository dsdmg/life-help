import { reactive } from 'vue'
import { showToast } from 'vant'
import { sendAppNotification } from './notification'

const HEARTBEAT_INTERVAL = 25000
const RECONNECT_INTERVAL = 5000

let socket = null
let heartbeatTimer = null
let reconnectTimer = null
let initialized = false

export const websocketState = reactive({
  status: '未连接',
  connected: false,
  clientId: '',
  username: '',
  lastMessage: '',
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
    return
  }

  if (payload.type === 'pong') {
    websocketState.lastPongAt = payload.timestamp || new Date().toISOString()
    return
  }

  if (payload.type === 'push_message') {
    websocketState.lastMessage = payload.message || ''
    websocketState.lastMessageSender = payload.sender || '系统'
    websocketState.lastMessageAt = payload.timestamp || new Date().toISOString()
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
