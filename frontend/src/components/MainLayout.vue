<template>
  <div class="main-layout">
    <router-view />
    <van-tabbar route>
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/function" icon="apps-o">功能</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
</script>

<style scoped>
.main-layout {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 50px;
}
</style>
