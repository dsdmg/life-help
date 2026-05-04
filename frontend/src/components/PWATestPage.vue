<template>
  <div class="pwa-test-page">
    <div class="header">
      <h1>Trade Mobile PWA 测试页面</h1>
      <p>用于测试 PWA 相关功能</p>
      <p class="version-text">当前版本：{{ appVersion }}</p>
    </div>
    
    <div class="button-grid">
      <van-button type="primary" @click="testStructure" block>
        结构测试
      </van-button>

      <van-button type="primary" plain @click="checkUpdate" block>
        检查更新
      </van-button>
      
      <van-button type="success" @click="installToDesktop" block>
        {{ installButtonText }}
      </van-button>
      
      <van-button type="info" @click="requestNotificationPermission" block>
        获取通知权限
      </van-button>
      
      <van-button type="warning" @click="sendNotification" block>
        发送通知
      </van-button>
      
      <van-button type="default" @click="testOffline" block>
        测试离线访问
      </van-button>
      
      <van-button type="default" @click="testCache" block>
        测试缓存策略
      </van-button>
      
      <van-button type="default" @click="testDeviceInfo" block>
        测试设备信息
      </van-button>
      
      <van-button type="default" @click="testGeolocation" block>
        测试地理位置
      </van-button>
    </div>
    
    <div class="result-section">
      <h2>测试结果</h2>
      <van-cell v-for="(result, index) in testResults" :key="index" :title="result.title" :value="result.value" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { showToast } from 'vant';
import packageJson from '../../package.json';
import { applyPwaUpdate, checkForPwaUpdate, pwaNeedRefresh } from '../pwa';

type TestResult = {
  title: string;
  value: string;
};

const testResults = ref<TestResult[]>([]);
const appVersion = packageJson.version;
let deferredPrompt: any = null;
let beforeInstallPromptFired = false;

window.addEventListener('beforeinstallprompt', (e: Event) => {
  console.log('[PWA] beforeinstallprompt 事件已触发', e);
  e.preventDefault();
  deferredPrompt = e;
  beforeInstallPromptFired = true;
  showToast('PWA 安装提示已就绪');
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] appinstalled 事件已触发，应用已安装');
  deferredPrompt = null;
  beforeInstallPromptFired = false;
  showToast('应用已成功安装');
});

// 结构测试
const testStructure = () => {
  const structure = {
    app: 'Trade Mobile',
    version: appVersion,
    components: ['PWATestPage', 'ScanQRCode'],
    pwa: {
      manifest: true,
      serviceWorker: true
    }
  };
  
  testResults.value = [
    { title: '应用名称', value: structure.app },
    { title: '版本', value: structure.version },
    { title: '组件数量', value: structure.components.length.toString() },
    { title: 'PWA 支持', value: '是' }
  ];
  
  showToast('结构测试完成');
};

const checkUpdate = async () => {
  try {
    const result = await checkForPwaUpdate();

    testResults.value = [
      { title: '当前版本', value: appVersion },
      { title: '更新检查', value: result.message },
      { title: '待刷新', value: pwaNeedRefresh.value ? '是' : '否' },
    ];

    if (!result.checked) {
      showToast(result.message);
      return;
    }

    if (result.hasUpdate) {
      showToast('检测到新版本，页面即将刷新');
      await applyPwaUpdate();
      return;
    }

    showToast('当前已是最新版本');
  } catch (error) {
    console.error('[PWA] 检查更新失败:', error);
    showToast('检查更新失败');
    testResults.value = [
      { title: '当前版本', value: appVersion },
      { title: '更新检查', value: '失败' },
    ];
  }
};

const isFirefox = /Firefox/i.test(navigator.userAgent);
const isChrome = /Chrome|CriOS/i.test(navigator.userAgent) && !/Edg|Firefox/i.test(navigator.userAgent);
const installButtonText = isFirefox ? '通过菜单安装' : '安装到桌面';

const getNotificationPermissionState = async () => {
  if (!('permissions' in navigator) || !navigator.permissions?.query) {
    return 'unsupported';
  }

  try {
    const status = await navigator.permissions.query({ name: 'notifications' as PermissionName });
    return status.state;
  } catch (error) {
    console.warn('[PWA] 查询通知权限状态失败:', error);
    return 'unknown';
  }
};

const diagnosePWA = () => {
  const swSupported = 'serviceWorker' in navigator;
  const manifestLink = document.querySelector('link[rel="manifest"]');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';

  const diagnosis = {
    swSupported,
    hasManifest: !!manifestLink,
    manifestHref: manifestLink?.getAttribute('href') || '未找到',
    isStandalone,
    isSecure,
    protocol: location.protocol,
    hostname: location.hostname,
    isFirefox,
    beforeInstallPromptFired,
    deferredPromptExists: !!deferredPrompt,
    userAgent: navigator.userAgent,
  };

  console.log('[PWA] 安装诊断信息:', diagnosis);
  return diagnosis;
};

const installToDesktop = () => {
  console.log('[PWA] 点击安装按钮, deferredPrompt:', deferredPrompt ? '存在' : '不存在');
  const diagnosis = diagnosePWA();

  if (deferredPrompt) {
    console.log('[PWA] 触发 PWA 安装提示');
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      console.log('[PWA] 安装选择结果:', choiceResult.outcome);
      if (choiceResult.outcome === 'accepted') {
        showToast('应用已安装到桌面');
      } else {
        showToast('安装被取消');
      }
      deferredPrompt = null;
    });
    return;
  }

  if (diagnosis.isStandalone) {
    console.log('[PWA] 应用已处于独立模式，无需再次安装');
    showToast('应用已安装');
    return;
  }

  if (isFirefox) {
    console.log('[PWA] Firefox 不支持 beforeinstallprompt 事件，请通过浏览器菜单安装');
    console.log('[PWA] Firefox 安装方式: 点击浏览器菜单 → 添加到主屏幕/安装');
    testResults.value = [
      { title: '浏览器', value: 'Firefox' },
      { title: 'Service Worker', value: diagnosis.swSupported ? '支持' : '不支持' },
      { title: 'Manifest', value: diagnosis.hasManifest ? '存在' : '缺失' },
      { title: 'HTTPS', value: diagnosis.isSecure ? '是' : '否' },
      { title: '安装方式', value: '浏览器菜单 → 安装' },
      { title: '图标刷新', value: '删除旧桌面图标后重新安装' },
    ];
    showToast('Firefox 请用菜单添加到主屏幕');
    return;
  }

  console.log('[PWA] 安装提示不可用，诊断结果:');
  console.log('  - Service Worker 支持:', diagnosis.swSupported);
  console.log('  - Manifest 存在:', diagnosis.hasManifest);
  console.log('  - HTTPS:', diagnosis.isSecure);
  console.log('  - 独立模式:', diagnosis.isStandalone);
  console.log('  - beforeinstallprompt 触发过:', diagnosis.beforeInstallPromptFired);
  showToast('安装提示不可用，请查看控制台日志');
};

// 获取通知权限
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    showToast('浏览器不支持通知');
    return;
  }

  const isSecure = window.isSecureContext;
  const beforePermission = Notification.permission;
  const permissionState = await getNotificationPermissionState();

  if (!isSecure) {
    showToast('当前不是安全上下文，通知不可用');
    testResults.value = [
      { title: '通知权限', value: '不可用' },
      { title: '安全上下文', value: '否' },
      { title: '协议', value: location.protocol },
    ];
    return;
  }

  if (beforePermission === 'granted') {
    showToast('通知权限已授予');
    testResults.value = [
      { title: '通知权限', value: '已授予' },
      { title: 'Permissions API', value: permissionState },
      { title: '浏览器', value: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : '其他' },
    ];
    return;
  }

  if (beforePermission === 'denied') {
    showToast(isChrome ? 'Chrome 已拦截通知，请到站点设置中改为允许' : '通知权限已被拒绝');
    testResults.value = [
      { title: '通知权限', value: '已拒绝' },
      { title: 'Permissions API', value: permissionState },
      { title: '浏览器', value: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : '其他' },
      { title: '说明', value: isChrome ? '需到地址栏/站点设置中手动改为允许' : '浏览器当前不再弹窗' },
    ];
    return;
  }

  const permission = await Notification.requestPermission();
  const afterPermissionState = await getNotificationPermissionState();

  if (permission === 'granted') {
    showToast('通知权限已授予');
    testResults.value = [
      { title: '通知权限', value: '已授予' },
      { title: 'Permissions API', value: afterPermissionState },
      { title: '浏览器', value: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : '其他' },
    ];
    return;
  }

  if (permission === 'default') {
    showToast('通知权限未选择，可能被浏览器静默拦截');
    testResults.value = [
      { title: '通知权限', value: '未选择' },
      { title: 'Permissions API', value: afterPermissionState },
      { title: '浏览器', value: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : '其他' },
      { title: '说明', value: '可能未弹窗或被静默拦截' },
    ];
    return;
  }

  showToast(isChrome ? 'Chrome 已拒绝或拦截通知，请检查站点通知设置' : '通知权限被拒绝');
  testResults.value = [
    { title: '通知权限', value: '已拒绝' },
    { title: 'Permissions API', value: afterPermissionState },
    { title: '浏览器', value: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : '其他' },
    { title: '说明', value: isChrome ? '请到 Chrome 站点设置中允许通知' : '浏览器返回 denied' },
  ];
};

// 发送通知
const sendNotification = async () => {
  if (!('Notification' in window)) {
    showToast('浏览器不支持通知');
    return;
  }

  if (Notification.permission !== 'granted') {
    showToast('请先获取通知权限');
    return;
  }

  const notificationOptions: NotificationOptions = {
    body: '这是一条测试通知，用于验证 PWA 通知功能',
    icon: '/logo/logo192.png',
    badge: '/logo/logo192.png',
    tag: 'pwa-test-notification',
    renotify: true,
    data: {
      source: 'pwa-test',
      createdAt: Date.now(),
    },
  };

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration() || await navigator.serviceWorker.ready;

      if (registration) {
        await registration.showNotification('Trade Mobile 测试通知', notificationOptions);
        showToast('通知已发送');
        testResults.value = [
          { title: '通知发送', value: '成功' },
          { title: '发送方式', value: 'Service Worker' },
          { title: '图标', value: '/logo/logo192.png' },
        ];
        return;
      }
    } catch (error) {
      console.error('[PWA] Service Worker 通知发送失败:', error);
    }
  }

  try {
    new Notification('Trade Mobile 测试通知', notificationOptions);
    showToast('通知已发送');
    testResults.value = [
      { title: '通知发送', value: '成功' },
      { title: '发送方式', value: 'Notification API' },
      { title: '图标', value: '/logo/logo192.png' },
    ];
  } catch (error) {
    console.error('[PWA] 普通通知发送失败:', error);
    showToast('通知发送失败，请检查 Service Worker 和站点通知设置');
    testResults.value = [
      { title: '通知发送', value: '失败' },
      { title: 'Service Worker', value: '不可用或未就绪' },
      { title: '说明', value: 'Chrome Android 建议使用 SW 通知' },
    ];
  }
};

// 测试离线访问
const testOffline = () => {
  if (navigator.onLine) {
    showToast('当前在线，离线测试需要断开网络');
    testResults.value = [{ title: '网络状态', value: '在线' }];
  } else {
    showToast('当前离线，应用仍可访问');
    testResults.value = [{ title: '网络状态', value: '离线' }];
  }
};

// 测试缓存策略
const testCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    testResults.value = [
      { title: '缓存数量', value: cacheNames.length.toString() },
      { title: '缓存名称', value: cacheNames.join(', ') }
    ];
    showToast('缓存测试完成');
  } else {
    showToast('浏览器不支持缓存');
  }
};

// 测试设备信息
const testDeviceInfo = () => {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    online: navigator.onLine
  };
  
  testResults.value = [
    { title: '浏览器', value: deviceInfo.userAgent.substring(0, 50) + '...' },
    { title: '语言', value: deviceInfo.language },
    { title: '平台', value: deviceInfo.platform },
    { title: '在线状态', value: deviceInfo.online ? '在线' : '离线' }
  ];
  
  showToast('设备信息测试完成');
};

// 测试地理位置
const testGeolocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        testResults.value = [
          { title: '纬度', value: position.coords.latitude.toString() },
          { title: '经度', value: position.coords.longitude.toString() },
          { title: '精度', value: position.coords.accuracy.toString() + ' 米' }
        ];
        showToast('地理位置获取成功');
      },
      (error) => {
        showToast('地理位置获取失败');
        testResults.value = [{ title: '错误', value: error.message }];
      }
    );
  } else {
    showToast('浏览器不支持地理位置');
  }
};
</script>

<style scoped>
.pwa-test-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.header p {
  font-size: 16px;
  color: #666;
}

.version-text {
  margin-top: 8px;
  font-size: 14px;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
}

.result-section {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.result-section h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
}

@media (max-width: 480px) {
  .button-grid {
    grid-template-columns: 1fr;
  }
}
</style>
