让我先查看项目中与扫描二维码相关的文件。

        
            
toolName: view_files
            
status: success
          
            
filePath: d:\ProjectMy\trade\trade-vue\apps\mobile\src\components\ScanQRCode.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: d:\ProjectMy\trade\trade-vue\apps\mobile\src\views\material\Scan.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: d:\ProjectMy\trade\trade-vue\apps\mobile\package.json
          
让我再查看一下测试文件和项目中其他可能相关的内容。


        
            
toolName: view_files
            
status: success
          
            
filePath: d:\ProjectMy\trade\trade-vue\apps\mobile\src\test\ScanQRCode.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: d:\ProjectMy\trade\trade-vue\apps\mobile\vite.config.ts
          
## `trade-vue` 移动端项目二维码扫描实现分析

### 1. 技术栈
- **核心库**：`html5-qrcode@^2.3.8`
- **UI框架**：Vant UI
- **Vue版本**：Vue 3 + 组合式 API

### 2. 核心组件实现

#### `ScanQRCode.vue` (`src/components/ScanQRCode.vue`)
这是项目的核心扫描组件，功能包括：

**功能特性：**
- ✅ 实时摄像头扫描
- ✅ 相册图片识别
- ✅ 多摄像头配置尝试（后置→前置→任意→自动）
- ✅ 摄像头权限检测
- ✅ 完善的错误处理和提示

**主要代码结构：**

```javascript
// 1. 初始化和生命周期
onMounted(() => {
  if (props.visible) {
    // 检查浏览器支持
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getCamerasInfo();
    } else {
      // 错误提示
    }
  }
});

// 2. 获取摄像头信息并请求权限
const getCamerasInfo = () => {
  // 先请求权限，再获取摄像头列表
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      // 关闭流
      stream.getTracks().forEach(track => track.stop());
      return Html5Qrcode.getCameras();
    })
    .then((devices) => {
      if (devices && devices.length) {
        state.html5QrCode = new Html5Qrcode("reader");
        startScan();
      }
    });
};

// 3. 开始扫描（多配置尝试）
const startScan = () => {
  const cameraConfigs = [
    { facingMode: "environment" }, // 后置
    { facingMode: "user" },        // 前置
    { facingMode: "any" },         // 任意
    undefined                      // 自动选择
  ];
  // 依次尝试配置，直到成功
};

// 4. 图片识别
const uploadImg = (file) => {
  const tempScanner = new Html5Qrcode("reader");
  tempScanner.scanFile(file.file, true)
    .then((decodedText) => {
      emit("success", decodedText);
    });
};
```

### 3. 使用示例

#### `Scan.vue` (`src/views/material/Scan.vue`)
这是使用 `ScanQRCode` 组件的示例页面，采用了分步交互设计：

```vue
<template>
  <div class="page-scan">
    <!-- 步骤指示器 -->
    <van-steps :active="activeStep" active-color="#07c160">
      <van-step>Scan</van-step>
      <van-step>Confirm</van-step>
    </van-steps>

    <!-- 输入和扫描区域 -->
    <van-field v-model="requisitionNumber" label="Req No.">
      <template #button>
        <van-button size="small" type="primary" icon="scan" @click="openScanner">
          Scan
        </van-button>
      </template>
    </van-field>

    <!-- 扫描组件 -->
    <ScanQRCode
      v-if="showScanner"
      :visible="showScanner"
      @close="showScanner = false"
      @success="onScanSuccess"
    />
  </div>
</template>
```

### 4. 关键问题分析

**发现的问题：**

1. **条件渲染问题**：组件使用 `v-if` 渲染，但 `onMounted` 只在组件首次挂载时触发，如果 `visible` prop 初始为 false，后续变更不会触发扫描初始化。

2. **组件卸载清理不完善**：在 `stopScan` 函数中，虽然调用了 `stop()`，但清理 DOM 的 `clear()` 调用可能存在问题。

3. **测试文件冗余**：存在两个内容基本一致的文件：
   - `src/components/ScanQRCode.vue`
   - `src/test/ScanQRCode.vue`

4. **watch 缺失**：没有监听 `visible` prop 的变化来动态启动/停止扫描。

### 5. 项目依赖
```json
{
  "html5-qrcode": "^2.3.8"
}
```