<template>
  <div class="login-page">
    <van-nav-bar title="登录" />
    <van-cell-group inset class="login-form">
      <van-field
        v-model="username"
        label="用户名"
        placeholder="请输入用户名"
        :rules="[{ required: true, message: '请输入用户名' }]"
      />
      <van-field
        v-model="password"
        type="password"
        label="密码"
        placeholder="请输入密码"
        :rules="[{ required: true, message: '请输入密码' }]"
      />
    </van-cell-group>
    <div class="login-button">
      <van-button type="primary" block @click="handleLogin" :loading="loading">
        登录
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    showToast('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const response = await axios.post('/api/login', {
      username: username.value,
      password: password.value
    })
    
    if (response.data.token) {
      userStore.login(username.value, response.data.token)
      showToast('登录成功')
      router.push('/home')
    } else {
      showToast(response.data.error || '登录失败')
    }
  } catch (error) {
    showToast(error.response?.data?.error || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.login-form {
  margin-top: 50px;
}

.login-button {
  margin: 20px 16px;
}
</style>
