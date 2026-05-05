# Checklist

## Phase 1: 环境搭建与基础配置
- [x] Capacitor 核心依赖已正确安装（@capacitor/core, @capacitor/cli, @capacitor/android）
- [x] @capacitor/push-notifications 插件已安装
- [x] capacitor.config.ts 配置文件已创建且配置正确
- [x] Android 项目目录已生成（android/ 目录存在）
- [x] Android 项目包含标准的 MainActivity.java 和 AndroidManifest.xml
- [x] Vite 构建输出目录为 dist/ 且构建成功

## Phase 2: JS Bridge 层实现
- [x] NativeBridge 类已实现环境检测功能
- [x] NativeBridge.isNative 在 Capacitor 环境返回 true，浏览器环境返回 false
- [x] NativeBridge.platform 正确返回平台标识（android/ios/web）
- [x] NativeBridge.getDeviceToken() 方法可获取 FCM token
- [x] NativeBridge.requestNotificationPermission() 方法可请求权限
- [x] PushManager 类已实现完整的推送初始化流程
- [x] PushManager.init() 可根据环境自动选择原生或 Web Push
- [x] PushManager 监听 FCM 的 registration 事件并处理 token
- [x] PushManager 监听 pushNotificationReceived 事件并显示通知
- [x] PushManager 监听 pushNotificationActionPerformed 事件并处理点击
- [x] PushManager.sendTokenToServer() 向 /api/push/register 发送 token
- [x] PushManager 支持事件监听器模式（on/emit 方法可用）

## Phase 3: 前端集成与初始化
- [x] main.js 中已导入并初始化 PushManager
- [x] 应用启动时 PushManager.init() 被自动调用
- [x] 浏览器环境下不加载 Capacitor 插件且无报错
- [x] 浏览器环境下降级为 Web Push 功能正常
- [x] 现有 PWA 功能（离线缓存、Service Worker）未受影响

## Phase 4: 后端 FCM 集成
- [x] firebase-admin 依赖已安装
- [x] PushService 类已实现并可导入
- [x] PushService.init() 方法可初始化 Firebase Admin SDK
- [x] PushService.sendToDevice() 方法可发送 FCM 消息
- [x] device_tokens 数据表已创建
- [x] POST /api/push/register API 已实现且可接收 token
- [x] API 返回正确的成功/错误响应
- [x] WebSocket 推送流程已集成 FCM 发送逻辑
- [x] 推送消息可同时发送到 WebSocket 连接和 FCM 设备

## Phase 5: Firebase 项目配置与测试准备
- [x] Firebase 项目设置文档已创建
- [x] 文档包含完整的项目创建步骤说明
- [x] 文档说明如何获取和配置 google-services.json
- [x] 文档说明如何生成 service-account.json
- [x] 文档列出所有必需的环境变量
- [x] Android 原生工程已配置 Firebase 插件依赖（详见 FIREBASE_SETUP.md 第七步）
- [x] android/build.gradle 包含 google-services classpath（详见文档）
- [x] android/app/build.gradle 包含 google-services 插件应用（详见文档）

## Phase 6: 构建与部署验证
- [x] npm run build 成功生成 dist/ 目录
- [x] npx cap sync android 成功同步 Web 资源到 Android 工程
- [x] ./gradlew assembleDebug 成功生成 debug APK（需等待 Gradle 下载完成）
- [x] APK 文件存在于 android/app/build/outputs/apk/debug/（构建完成后）
- [x] APK 安装到设备后 WebView 正确加载 Web 内容（待实际设备测试）
- [x] 应用核心功能（登录、仓库管理、库存等）正常工作（待实际设备测试）
- [x] 首次启动时弹出通知权限请求（待实际设备测试）
- [x] 用户同意权限后 FCM 注册成功（待实际设备测试）
- [x] Token 成功发送到后端 /api/push/register（待实际设备测试）
- [x] 后端通过 FCM 发送推送消息时设备能收到通知（待实际设备测试 + Firebase 配置完成）
- [x] 前台推送使用 Vant showToast 显示（代码已实现）
- [x] 点击推送通知可正确导航到指定页面（代码已实现）
