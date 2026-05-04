<template>
  <div class="function-page">
    <van-nav-bar title="功能" />
    <van-grid :column-num="2" class="menu-grid">
      <van-grid-item
        icon="shop-o"
        text="仓库管理"
        @click="navigateTo('/warehouse')"
      />
      <van-grid-item
        icon="goods-collect-o"
        text="物品管理"
        @click="navigateTo('/item')"
      />
      <van-grid-item
        icon="search"
        text="库存查询"
        @click="navigateTo('/inventory')"
      />
      <van-grid-item
        icon="orders-o"
        text="出入库记录"
        @click="navigateTo('/record')"
      />
      <van-grid-item
        icon="scan"
        text="扫描出库"
        @click="navigateTo('/scan-out')"
      />
      <van-grid-item
        icon="mobile-o"
        text="PWA测试"
        @click="navigateTo('/pwa-test')"
      />
    </van-grid>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (path) => {
  router.push(path)
}
</script>

<style scoped>
.function-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.menu-grid {
  margin-top: 20px;
}
</style>
