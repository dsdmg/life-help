<template>
  <div class="scan-container">
    <div class="scan-header">
      <van-icon name="arrow-left" @click="closeScan" />
      <h1>扫描二维码</h1>
    </div>
    <div class="qr-container">
      <div class="qr-box">
        <div id="reader"></div>
      </div>
    </div>
    <div class="btn-box">
      <div class="album-btn">
        <van-uploader
          v-model="state.fileList"
          :preview-image="false"
          :after-read="uploadImg"
        >
          <van-icon name="photo-o" />
        </van-uploader>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scan-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #333;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}
.scan-header {
  display: flex;
  align-items: center;
  padding: 20px;
  color: #fff;
  z-index: 10000;
}
.scan-header h1 {
  font-size: 18px;
  font-weight: normal;
  margin: 0;
  margin-left: 10px;
}
.scan-header .van-icon {
  font-size: 24px;
}
.qr-container {
  flex: 1;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.qr-box {
  width: 100%;
  height: 100%;
  position: relative;
}
#reader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
#reader :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.btn-box {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0;
  z-index: 10000;
}
.album-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}
.album-btn .van-icon {
  font-size: 28px;
}
.album-btn .van-uploader {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<script setup>
import { reactive, onMounted, onUnmounted } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import { showToast } from "vant";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["close", "success"]);

const state = reactive({
  html5QrCode: null,
  fileList: []
});

onMounted(() => {
  if (props.visible) {
    // 检查浏览器是否支持 getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log("浏览器支持 getUserMedia");
      getCamerasInfo();
    } else {
      console.error("浏览器不支持 getUserMedia");
      showToast({
        message: "浏览器不支持摄像头功能！",
        duration: 2000,
      });
      emit("close");
    }
  }
});

onUnmounted(() => {
  if (state.html5QrCode?.isScanning) {
    stopScan();
  }
});

const closeScan = () => {
  if (state.html5QrCode?.isScanning) {
    stopScan();
  }
  emit("close");
};

const getCamerasInfo = () => {
  console.log("开始获取摄像头信息");
  
  // 直接请求摄像头权限
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then((stream) => {
      console.log("获取摄像头权限成功");
      // 关闭流，因为我们只是为了获取权限
      stream.getTracks().forEach(track => track.stop());
      
      // 然后获取摄像头列表
      return Html5Qrcode.getCameras();
    })
    .then((devices) => {
      console.log("获取摄像头成功:", devices);
      if (devices && devices.length) {
        console.log("找到摄像头，开始初始化扫描");
        state.html5QrCode = new Html5Qrcode("reader");
        startScan();
      } else {
        console.log("未找到摄像头设备");
        showToast({
          message: "未找到摄像头设备！",
          duration: 2000,
        });
        emit("close");
      }
    })
    .catch((err) => {
      console.error("获取摄像头失败:", err);
      showToast({
        message: "摄像头无访问权限！",
        duration: 2000,
      });
      emit("close");
    });
};

const startScan = () => {
  console.log("开始扫描");
  
  state.html5QrCode
    .start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 300, height: 300 }
      },
      (decodedText, decodedResult) => {
        stopScan();
        emit("success", decodedText);
      },
      (errorMessage) => {
        // 扫描错误，忽略
      }
    )
    .then(() => {
      console.log("后置摄像头扫描启动成功");
    })
    .catch((err) => {
      console.error("后置摄像头启动失败，尝试前置摄像头:", err);
      state.html5QrCode
        .start(
          { facingMode: "user" },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 }
          },
          (decodedText, decodedResult) => {
            stopScan();
            emit("success", decodedText);
          },
          (errorMessage) => {
            // 扫描错误，忽略
          }
        )
        .then(() => {
          console.log("前置摄像头扫描启动成功");
        })
        .catch((err2) => {
          console.error("所有摄像头启动失败:", err2);
          showToast({
            message: "无法启动摄像头！",
            duration: 2000,
          });
          emit("close");
        });
    });
};

const stopScan = () => {
  if (state.html5QrCode) {
    // 先停止扫描，然后再清理 DOM
    state.html5QrCode
      .stop()
      .then(() => {
        // 扫描停止后再清理 DOM
        return state.html5QrCode.clear();
      })
      .then(() => {
        console.log("已停止扫码并清理 DOM 元素");
      })
      .catch(err => {
        // 忽略错误，因为我们只是想尽快清理
        console.log("清理时出错:", err);
      });
  }
};

const uploadImg = (file) => {
  try {
    console.log("开始识别图片");
    // 使用 Html5QrcodeScanner 或正确的 API 来识别图片
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      console.log("图片加载完成，开始识别");
      
      // 创建一个临时的 Html5Qrcode 实例来识别图片
      const tempScanner = new Html5Qrcode("reader");
      tempScanner.scanFile(file.file, true)
        .then((decodedText) => {
          console.log("图片识别成功:", decodedText);
          emit("success", decodedText);
        })
        .catch((err) => {
          console.error("图片识别失败:", err);
          showToast({
            message: "识别失败！",
            duration: 2000,
          });
        });
    };
    reader.readAsDataURL(file.file);
  } catch (error) {
    console.log(error);
    showToast({
      message: "识别失败！",
      duration: 2000,
    });
  }
};
</script>