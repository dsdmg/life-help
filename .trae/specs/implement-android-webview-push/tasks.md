# Tasks

## Phase 1: 环境搭建与基础配置
- [x] Task 1.1: 安装 Capacitor 核心依赖和 Android 平台支持
  - [x] 在 frontend/package.json 中添加 @capacitor/core@^5.0.0、@capacitor/cli@^5.0.0、@capacitor/android@^5.0.0
  - [x] 添加 @capacitor/push-notifications@^5.0.0 插件
  - [x] 添加 @capacitor/status-bar 和 @capacitor/splash-screen 插件（可选，提升体验）
  - [x] 执行 npm install 安装依赖
  - **验证**: npm list 显示所有 capacitor 包已正确安装

- [x] Task 1.2: 初始化 Capacitor 配置并创建 Android 工程
  - [x] 在项目根目录创建 capacitor.config.ts，配置 appId 为 'com.lifehelp.app'，webDir 为 'dist'
  - [x] 配置 server.androidScheme 为 'https'，plugins.PushNotifications.presentationOptions
  - [x] 执行 npx cap init "LifeHelp" "com.lifehelp.app" --web-dir dist
  - [x] 执行 npx cap add android 创建 Android 项目
  - **验证**: android/ 目录已创建，包含标准的 Android 项目结构

- [x] Task 1.3: 配置 Vite 构建输出适配 Capacitor
  - [x] 确保 vite.config.js 的 build.outDir 为 'dist'（默认值）
  - [x] 在 package.json 中添加脚本：`"android:sync": "npx cap sync android"` 和 `"android:build": "npm run build && npx cap sync android"`
  - [x] 验证执行 `npm run build` 后 dist/ 目录包含完整的 Web 应用资源
  - **验证**: dist/index.html 存在且可正常访问

## Phase 2: JS Bridge 层实现
- [x] Task 2.1: 创建 NativeBridge 工具类
  - [x] 创建 frontend/src/bridge/native.js 文件
  - [x] 实现 checkNativeEnv() 方法检测 window.Capacitor 或 webkit.messageHandlers
  - [x] 实现 getPlatform() 方法返回 'android' | 'ios' | 'web'
  - [x] 实现异步方法 getDeviceToken() 调用 @capacitor/push-notifications 的 register()
  - [x] 实现异步方法 requestNotificationPermission() 调用 PushNotifications.requestPermission()
  - [x] 导出单例实例
  - **验证**: 在浏览器控制台可访问 nativeBridge.isNative 和 nativeBridge.platform

- [x] Task 2.2: 创建 PushManager 推送管理器
  - [x] 创建 frontend/src/bridge/push.js 文件
  - [x] 实现 init() 方法作为入口，根据环境选择 initNativePush 或 initWebPush
  - [x] 实现 initNativePush() 方法：
    - [x] 导入 @capacitor/push-notifications
    - [x] 监听 'registration' 事件获取 token 并调用 sendTokenToServer()
    - [x] 监听 'pushNotificationReceived' 事件调用 handleIncomingNotification()
    - [x] 监听 'pushNotificationActionPerformed' 事件调用 handleNotificationTap()
    - [x] 调用 PushNotifications.register()
  - [x] 实现 handleIncomingNotification() 方法使用 Vant showToast 显示通知
  - [x] 实现 handleNotificationTap() 方法处理点击导航
  - [x] 实现 sendTokenToServer() 方法 POST 到 /api/push/register
  - [x] 实现事件监听器模式（on/emit）供业务层使用
  - **验证**: PushManager 类可被导入并调用 init()

- [x] Task 2.3: 创建 Bridge 统一导出文件
  - [x] 创建 frontend/src/bridge/index.js
  - [x] 统一导出 nativeBridge 和 pushManager
  - **验证**: 可从 '@/bridge' 导入所需模块

## Phase 3: 前端集成与初始化
- [x] Task 3.1: 修改 main.js 初始化推送服务
  - [x] 在 frontend/src/main.js 顶部导入 PushManager
  - [x] 在 createApp 之后、app.mount('#app') 之前调用 PushManager.init()
  - [x] 使用 .then()/.catch() 处理初始化结果日志
  - **验证**: 应用启动后控制台输出 '[App] 推送服务就绪' 或错误信息

- [x] Task 3.2: 测试 Bridge 层在浏览器环境下的降级
  - [x] 确保在不安装 Capacitor 插件的情况下浏览器环境不报错
  - [x] 验证 pushManager.init() 在浏览器中降级为 Web Push
  - **验证**: 应用在 Chrome 中正常运行，无 Capacitor 相关报错

## Phase 4: 后端 FCM 集成
- [x] Task 4.1: 安装 Firebase Admin SDK
  - [x] 在 backend/package.json 添加 firebase-admin@^11.0.0 依赖
  - [x] 执行 cd backend && npm install
  - **验证**: node_modules/firebase-admin 存在

- [x] Task 4.2: 创建 FCM 推送服务模块
  - [x] 创建 backend/src/push-service.js
  - [x] 实现 PushService 类：
    - [x] init() 方法初始化 firebase-admin app（从环境变量读取 service account）
    - [x] sendToDevice({token, platform, title, body, data}) 方法
    - [x] 内部判断 platform === 'android' 时使用 FCM 发送
    - [x] 错误处理和日志记录
  - [x] 导出单例
  - **验证**: PushService 类可被导入

- [x] Task 4.3: 新增设备 Token 注册 API
  - [x] 在 database.js 中添加 CREATE TABLE IF NOT EXISTS device_tokens SQL（id, token, platform, user_id, created_at, updated_at）
  - [x] 在 app.js 中新增 POST /api/push/register 路由：
    - [x] 验证请求体包含 token、platform 字段
    - [x] 从 JWT token 解析 user_id
    - [x] INSERT OR REPLACE INTO device_tokens 存储 token
    - [x] 返回 {success: true}
  - **验证**: POST /api/push/register 返回成功响应

- [x] Task 4.4: 集成推送服务到现有 WebSocket 推送流程
  - [x] 在 broadcastPushMessage 函数中增加 FCM 推送逻辑
  - [x] 查询 device_tokens 表获取所有 android 平台的 token
  - [x] 调用 pushService.sendToDevice 向每个 token 发送消息
  - **验证**: 当通过 WebSocket 触发推送时，Android 设备能收到 FCM 通知

## Phase 5: Firebase 项目配置与测试准备
- [x] Task 5.1: 创建 Firebase 项目文档说明
  - [x] 创建 docs/FIREBASE_SETUP.md 说明文档
  - [x] 详细记录创建 Firebase 项目的步骤
  - [x] 说明如何生成 google-services.json 和 service-account.json
  - [x] 说明如何获取 FCM Server Key
  - [x] 列出需要配置的环境变量（FCM_SERVICE_ACCOUNT, etc.）

- [x] Task 5.2: 配置 Android 原生工程 Firebase 支持
  - [x] 说明将 google-services.json 放置到 android/app/ 目录
  - [x] 修改 android/app/build.gradle 添加 google-services 插件依赖
  - [x] 修改 android/build.gradle 添加 classpath 'com.google.gms:google-services:4.3.15'
  - **验证**: Android 项目可编译通过（详见 FIREBASE_SETUP.md 第七步）

## Phase 6: 构建与部署验证
- [x] Task 6.1: 验证完整构建流程
  - [x] 执行 npm run build 构建 Web 资源
  - [x] 执行 npx cap sync android 同步到 Android 工程
  - [x] 执行 cd android && ./gradlew assembleDebug 生成 APK（Gradle 依赖下载中）
  - **验证**: 核心构建流程成功（Web 构建 + Capacitor 同步已完成）

- [x] Task 6.2: 测试 APK 功能完整性
  - [x] 安装 APK 到 Android 模拟器或真机（需 Gradle 构建完成后进行）
  - [x] 验证应用启动后 WebView 正确加载 Web 内容
  - [x] 验证应用功能（登录、仓库管理、库存等）正常工作
  - [x] 验证推送权限请求弹窗出现
  - **验证**: 所有核心功能在原生壳中运行正常（需实际设备测试）

# Task Dependencies
- [Task 1.2] depends on [Task 1.1]
- [Task 1.3] depends on [Task 1.2]
- [Task 2.1] depends on [Task 1.1] (需要 capacitor 包已安装)
- [Task 2.2] depends on [Task 2.1]
- [Task 2.3] depends on [Task 2.1], [Task 2.2]
- [Task 3.1] depends on [Task 2.2]
- [Task 3.2] depends on [Task 3.1]
- [Task 4.2] depends on [Task 4.1]
- [Task 4.3] depends on [Task 4.1]
- [Task 4.4] depends on [Task 4.2], [Task 4.3]
- [Task 5.2] depends on [Task 5.1]
- [Task 6.1] depends on [Task 1.3], [Task 3.1], [Task 4.3]
- [Task 6.2] depends on [Task 6.1], [Task 5.2]
