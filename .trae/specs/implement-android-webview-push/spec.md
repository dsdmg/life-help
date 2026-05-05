# Android 原生壳 WebView 推送改造 Spec

## Why
当前 PWA 方案在 Android 上存在严重推送限制：Service Worker 在后台容易被系统杀掉导致推送丢失、需要用户手动授权通知（授权率仅 40-60%）、无法实现真正的离线推送。通过构建原生 WebView 壳应用并集成 FCM (Firebase Cloud Messaging)，可将推送到达率从 60-70% 提升至 95%+，同时保留现有 Web 前端代码不变，实现最小改动最大收益。

## What Changes
- **新增 Capacitor 框架集成**：安装 @capacitor/core、@capacitor/cli、@capacitor/android 及相关插件
- **新增 Android 原生工程**：创建 android/ 目录及标准 Android 项目结构
- **新增 JS Bridge 层**：创建 frontend/src/bridge/ 目录，实现 NativeBridge 和 PushManager 类
- **新增 FCM 推送集成**：配置 Firebase 项目，集成 FCM SDK，实现设备注册和消息接收
- **修改后端推送服务**：新增 /api/push/register 端点支持 FCM token 注册，添加 FCM 发送能力
- **新增 Capacitor 配置**：创建 capacitor.config.ts 配置文件
- **修改前端入口**：在 main.js 中初始化 PushManager

## Impact
- Affected specs: 无（全新功能）
- Affected code:
  - frontend/package.json（添加依赖）
  - frontend/src/main.js（初始化推送）
  - frontend/src/bridge/（新建目录）
  - backend/src/app.js（新增 API）
  - backend/package.json（添加依赖）
  - android/（新建目录）
  - capacitor.config.ts（新建）

## ADDED Requirements

### Requirement: Capacitor 环境搭建
系统 SHALL 提供完整的 Capacitor 开发环境，包括：
- 安装所有必需的 npm 包（@capacitor/core, @capacitor/cli, @capacitor/android, @capacitor/push-notifications）
- 创建标准的 Android 项目结构（android/app/src/main/）
- 生成 capacitor.config.ts 配置文件，包含 appId、webDir、服务器配置等

#### Scenario: 成功初始化 Capacitor
- **WHEN** 执行 `npx cap init` 和 `npx cap add android`
- **THEN** 应生成 android/ 目录结构，包含 MainActivity.java、AndroidManifest.xml 等核心文件
- **AND** capacitor.config.ts 应正确指向 dist 目录作为 webDir

### Requirement: JS Bridge 层实现
系统 SHALL 提供 NativeBridge 类用于检测运行环境并调用原生功能：
- 自动检测是否运行在 Capacitor 原生环境
- 获取当前平台信息（android/ios/web）
- 封装获取 FCM 设备 token 的方法
- 封装请求通知权限的方法

#### Scenario: 检测原生环境
- **WHEN** 应用在 Android WebView 中启动
- **THEN** NativeBridge.isNative 应返回 true
- **AND** NativeBridge.platform 应返回 'android'

#### Scenario: 获取设备 Token
- **WHEN** 调用 nativeBridge.getDeviceToken()
- **AND** 用户已授予通知权限
- **THEN** 应返回有效的 FCM registration token（字符串格式）

### Requirement: FCM 推送管理器
系统 SHALL 提供 PushManager 类统一管理推送功能：
- 初始化时自动请求通知权限
- 根据环境选择原生推送或 Web Push
- 监听 FCM 推送事件（registration、pushNotificationReceived、pushNotificationActionPerformed）
- 处理前台推送显示和点击跳转
- 将设备 token 发送到后端注册

#### Scenario: 推送初始化成功
- **WHEN** 应用启动并调用 pushManager.init()
- **AND** 用户同意通知权限
- **THEN** 应成功注册到 FCM 并获得 token
- **AND** token 应通过 /api/push/register 发送到后端存储

#### Scenario: 接收前台推送
- **WHEN** 应用处于前台状态收到 FCM 推送
- **THEN** 应使用 Vant showToast 显示通知内容
- **AND** 触发 'message' 事件供业务层监听

#### Scenario: 处理推送点击
- **WHEN** 用户点击通知栏的推送消息
- **AND** 推送数据中包含 url 字段
- **THEN** 应导航到指定的 url 路径

### Requirement: 后端 FCM 集成
系统 SHALL 提供后端 API 支持 FCM 推送：
- 新增 POST /api/push/register 端点，接收并存储 FCM token
- 新增 device_tokens 数据表存储设备和 token 映射关系
- 集成 firebase-admin SDK 用于发送 FCM 消息
- 支持向指定 token 或 topic 发送推送

#### Scenario: 注册设备 Token
- **WHEN** POST /api/push/register 携带 {token, platform, user_id}
- **THEN** 应将 token 存入 device_tokens 表
- **AND** 返回 {success: true, message: '设备注册成功'}

#### Scenario: 发送 FCM 推送
- **WHEN** 调用 pushService.sendToDevice({token, platform: 'android', title, body})
- **THEN** 应通过 firebase-admin 向 FCM 发送消息
- **AND** 消息应包含 notification（title, body）和 data 对象

### Requirement: 构建和部署流程
系统 SHALL 提供完整的 Android APK 构建流程：
- 配置 Vite 构建输出到 dist/ 目录
- 同步 Web 资源到 Android 工程（npx cap sync）
- 支持开发模式（debug）和生产模式（release）构建
- 配置 Android 签名信息用于发布

#### Scenario: 构建 Debug APK
- **WHEN** 执行 `npm run build && npx cap sync && cd android && ./gradlew assembleDebug`
- **THEN** 应在 android/app/build/outputs/apk/debug/ 生成 .apk 文件
- **AND** APK 安装后应能正常加载 Web 应用

## MODIFIED Requirements

### Requirement: 前端入口初始化
现有的 frontend/src/main.js SHALL 在应用启动时初始化 PushManager：

```javascript
import PushManager from './bridge/push'

const app = createApp(App)
// ... 其他配置

// 应用挂载前初始化推送服务
PushManager.init().then(() => {
  console.log('[App] 推送服务就绪')
}).catch((error) => {
  console.error('[App] 推送服务初始化失败:', error)
})

app.use(router)
app.use(pinia)
app.mount('#app')
```

#### Scenario: 启动时自动初始化
- **WHEN** 应用首次加载
- **THEN** PushManager.init() 应被自动调用
- **AND** 不应阻塞应用的正常渲染

### Requirement: 降级兼容性
系统 SHALL 在非原生环境下保持现有 PWA 功能：
- 当检测到非 Capacitor 环境（普通浏览器），PushManager 应降级为使用现有的 Web Push + ServiceWorker 方案
- notification.js 中的 sendAppNotification 方法应继续工作
- 不影响现有的 PWA 功能（离线缓存、安装提示等）

#### Scenario: 浏览器环境降级
- **WHEN** 应用在 Chrome/Safari 等浏览器打开
- **THEN** PushManager 应调用 initWebPush() 使用 ServiceWorker
- **AND** 不应尝试加载 Capacitor 插件

## REMOVED Requirements
无（此改造为增量添加，不删除现有功能）
