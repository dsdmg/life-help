<template>
  <div class="profile-page">
    <van-nav-bar title="我的" />
    <van-cell-group inset class="user-info">
      <van-cell center>
        <template #icon>
          <van-icon name="user-o" size="40" color="#1989fa" style="margin-right: 15px;" />
        </template>
        <template #title>
          <div class="username">{{ userStore.username || '未登录' }}</div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="menu-group">
      <van-cell center title="WebSocket 连接状态">
        <template #value>
          <van-tag :type="statusTagType">{{ websocketState.status }}</van-tag>
        </template>
      </van-cell>
      <van-cell
        title="最近推送"
        :value="websocketState.lastMessage || '暂无消息'"
      />
    </van-cell-group>

    <van-cell-group inset class="menu-group">
      <van-cell
        title="退出登录"
        icon="revoke"
        is-link
        @click="handleLogout"
      />
    </van-cell-group>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog } from 'vant'
import { useUserStore } from '@/stores/user'
import { websocketState } from '@/utils/websocket'

const router = useRouter()
const userStore = useUserStore()

const statusTagType = computed(() => {
  if (websocketState.connected) {
    return 'success'
  }

  if (websocketState.status === '连接中' || websocketState.status === '重连中') {
    return 'warning'
  }

  return 'danger'
})

const handleLogout = () => {
  showDialog({
    title: '提示',
    message: '确定要退出登录吗？',
    showCancelButton: true
  }).then(() => {
    userStore.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.user-info {
  margin-top: 20px;
}

.username {
  font-size: 18px;
  font-weight: bold;
}

.menu-group {
  margin-top: 20px;
}
</style>
