# Firebase 项目配置指南

本文档详细说明如何为 LifeHelp Android 应用配置 Firebase Cloud Messaging (FCM) 推送服务。

## 前置要求

- Google 账号
- Android Studio（可选，用于生成签名证书）
- Node.js 环境

## 第一步：创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"添加项目"
3. 输入项目名称：`LifeHelp`
4. 选择或创建 Google Analytics 账号（可选）
5. 点击"创建项目"

## 第二步：添加 Android 应用

1. 在项目概览页面，点击"添加应用"
2. 选择 **Android** 平台
3. 填写以下信息：
   - **Android 包名**: `com.lifehelp.app`（与 capacitor.config.ts 中的 appId 一致）
   - **应用昵称**: `LifeHelp`（可选）
   - **调试签名证书 SHA-1**（开发阶段可跳过）
4. 点击"注册应用"
5. 下载 **google-services.json** 文件

## 第三步：配置 google-services.json

1. 将下载的 `google-services.json` 文件放置到：
   ```
   android/app/google-services.json
   ```

2. 确保文件路径正确：
   - ✅ 正确: `frontend/android/app/google-services.json`
   - ❌ 错误: `android/google-services.json`

## 第四步：生成 Service Account 密钥

后端服务器需要 Service Account 来发送 FCM 消息。

### 4.1 进入服务账号设置

1. 在 Firebase Console 中，点击左侧菜单的 **设置**（齿轮图标）
2. 选择 **用户和权限**
3. 点击 **服务账号** 标签页
4. 点击 **创建服务账号**

### 4.2 创建新的服务账号

1. 输入服务账号名称：`lifehelp-push-service`
2. 选择角色：**Project > Admin**（或更细粒度的 **Cloud Messaging Admin**）
3. 点击 **创建并继续**
4. 在第二步"授予此服务账号对项目的访问权限"，点击 **完成**

### 4.3 生成密钥文件

1. 在服务账号列表中，找到刚创建的 `lifehelp-push-service`
2. 点击该服务账号进入详情页
3. 切换到 **密钥** 标签页
4. 点击 **添加密钥** -> **创建新密钥**
5. 选择 **JSON** 格式
6. 点击 **创建**，系统会自动下载 JSON 文件
7. 将文件重命名为 `service-account.json` 并妥善保存（不要提交到代码仓库！）

## 第五步：配置环境变量

在后端项目中配置以下环境变量：

### 方式一：使用 .env 文件（推荐用于开发）

在 `backend/` 目录下创建 `.env` 文件：

```env
# Firebase 服务账号 JSON 内容（完整复制 service-account.json 的内容）
FCM_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**注意**：
- 将完整的 JSON 内容作为字符串赋值给 `FCM_SERVICE_ACCOUNT`
- 保持 JSON 格式的引号转义正确
- 不要将 `.env` 文件提交到 Git 仓库（添加到 `.gitignore`）

### 方式二：使用环境变量（生产环境）

在服务器上设置环境变量：

```bash
# Linux/Mac
export FCM_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Windows PowerShell
$env:FCM_SERVICE_ACCOUNT = '{"type":"service_account",...}'
```

## 第六步：获取 FCM Server Key（可选）

如果需要使用旧版 FCM HTTP API：

1. 在 Firebase Console 中，进入 **项目设置**
2. 切换到 **云消息传递** 标签页
3. 找到 **服务器密钥** 部分
4. 复制 **服务器密钥**（以 `AAAA` 开头的长字符串）

⚠️ **注意**：新版 API 推荐使用 Service Account 认证，Server Key 已被弃用。

## 第七步：Android 工程配置

### 7.1 修改 android/build.gradle

确保根级 build.gradle 包含 Google Services 插件依赖：

```gradle
buildscript {
    dependencies {
        // ... 其他依赖
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

### 7.2 修改 android/app/build.gradle

确保应用级 build.gradle 应用 Google Services 插件：

```gradle
apply plugin: 'com.android.application'

// 在文件顶部添加
apply plugin: 'com.google.gms.google-services'

android {
    // ... 其他配置
}

dependencies {
    // ... 其他依赖
    implementation platform('com.google.firebase:firebase-bom:31.2.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

## 第八步：验证配置

### 8.1 后端测试

启动后端服务并检查日志输出：

```bash
cd backend
node src/app.js
```

如果看到 `[PushService] Firebase Admin SDK 初始化成功` 日志，说明配置正确。

### 8.2 发送测试推送

可以使用 curl 测试 FCM 发送功能：

```bash
curl -X POST http://localhost:3000/api/push/test \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_DEVICE_TOKEN",
    "message": "测试消息"
  }'
```

## 常见问题排查

### 问题 1：Firebase Admin SDK 初始化失败

**错误信息**: `[PushService] 未配置 FCM_SERVICE_ACCOUNT 环境变量`

**解决方案**:
- 检查 `.env` 文件是否存在且路径正确
- 验证环境变量名称是否完全匹配 `FCM_SERVICE_ACCOUNT`
- 确认 JSON 格式有效（可用在线 JSON 验证器检查）

### 问题 2：FCM 消息发送失败 - 权限错误

**错误信息**: `Permission denied`

**解决方案**:
- 检查 Service Account 是否有正确的角色权限
- 确认 private_key 未过期
- 验证 project_id 与 Firebase 项目一致

### 问题 3：Android 设备收不到推送

**可能原因**:
1. 设备未连接互联网
2. 应用被系统杀掉（需要优化电池优化设置）
3. 通知权限被拒绝
4. Token 过期或无效

**排查步骤**:
1. 检查设备网络连接
2. 在应用设置中允许通知和后台运行
3. 查看 Logcat 日志中的 FCM 相关输出
4. 重新注册设备 Token

## 安全注意事项

⚠️ **重要**：

1. **永远不要将 Service Account JSON 文件提交到 Git 仓库**
   - 将 `service-account.json` 和 `.env` 添加到 `.gitignore`
   - 生产环境通过安全的方式注入环境变量

2. **定期轮换密钥**
   - 定期重新生成 Service Account 密钥
   - 删除不再使用的旧密钥

3. **限制权限范围**
   - 只授予必要的最小权限（如 `firebase-adminsdk` 角色）
   - 避免使用 Project Owner 等高权限角色

## 相关文档链接

- [Firebase 官方文档](https://firebase.google.com/docs)
- [FCM 发送指南](https://firebase.google.com/docs/cloud-messaging/server)
- [Capacitor Push Notifications 插件](https://capacitorjs.com/docs/apis/push-notifications)

## 下一步

配置完成后，你可以：

1. 构建并安装 Android APK 到真机
2. 登录应用并触发推送权限请求
3. 通过 WebSocket 或 API 发送测试消息
4. 验证设备是否收到 FCM 推送通知

祝配置顺利！🎉
