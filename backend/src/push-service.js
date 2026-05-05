const admin = require('firebase-admin')

class PushService {
  constructor() {
    this.fcmApp = null
  }

  async init() {
    if (this.fcmApp) return
    
    try {
      let serviceAccount
      
      if (process.env.FCM_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT)
      } else {
        console.warn('[PushService] 未配置 FCM_SERVICE_ACCOUNT 环境变量')
        return
      }

      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      }, 'push-app')

      console.log('[PushService] Firebase Admin SDK 初始化成功')
    } catch (error) {
      console.error('[PushService] Firebase Admin SDK 初始化失败:', error)
    }
  }

  async sendToDevice({ token, platform, title, body, data }) {
    try {
      if (!this.fcmApp) {
        await this.init()
      }

      if (!this.fcmApp) {
        throw new Error('Firebase Admin SDK 未初始化')
      }

      if (platform === 'android') {
        await this.sendFCM(token, title, body, data)
      } else {
        console.warn(`[PushService] 不支持的平台: ${platform}`)
        return false
      }
      
      return true
    } catch (error) {
      console.error('[PushService] 发送失败:', error)
      return false
    }
  }

  async sendFCM(token, title, body, data) {
    await this.fcmApp.messaging().send({
      token,
      notification: { 
        title: title || 'LifeHelp', 
        body: body || '' 
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'lifehelp-push',
          priority: 'high',
          sound: 'default'
        }
      }
    })
    
    console.log(`[PushService] FCM 消息发送成功: ${token.substring(0, 20)}...`)
  }

  async sendToMultiple(tokens, title, body, data) {
    if (!tokens || tokens.length === 0) return
    
    const message = {
      notification: {
        title: title || 'LifeHelp',
        body: body || ''
      },
      data: data || {},
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          channelId: 'lifehelp-push',
          priority: 'high',
          sound: 'default'
        }
      }
    }

    try {
      if (!this.fcmApp) {
        await this.init()
      }

      const response = await this.fcmApp.messaging().sendEachForMulticast(message)
      console.log(`[PushService] 批量发送完成: ${response.successCount} 成功, ${response.failureCount} 失败`)
      return response
    } catch (error) {
      console.error('[PushService] 批量发送失败:', error)
      throw error
    }
  }
}

module.exports = new PushService()
