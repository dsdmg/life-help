<template>
  <div class="home-page">
    <van-nav-bar title="生活助手" />
    <div class="tabs-container">
      <van-tabs v-model:active="activeTab" @change="onTabChange">
        <van-tab v-for="day in [1, 2, 3, 4, 5]" :key="day" :title="`${day}天内`" />
      </van-tabs>
    </div>
    <div class="content">
      <van-loading v-if="loading" class="loading" />
      <van-empty v-else-if="!loading && items.length === 0" description="暂无快过期物品" />
      <van-list v-else>
        <van-cell-group inset>
          <van-cell
            v-for="item in items"
            :key="item.id"
            :title="item.name"
            :label="`仓库：${item.warehouse} | 批号：${item.batch_number || '无'} | 数量：${item.quantity}`"
          >
            <template #right-icon>
              <van-tag :type="getExpiryType(item.daysLeft)">
                剩余{{ item.daysLeft }}天
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </van-list>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/utils/axios'

const activeTab = ref(0)
const loading = ref(false)
const items = ref([])

const fetchExpiringItems = async (days) => {
  loading.value = true
  try {
    const res = await axios.get('/api/inventory/expiring', { params: { days } })
    items.value = res.data || []
  } catch (error) {
    console.error('获取快过期物品失败:', error)
    items.value = []
  } finally {
    loading.value = false
  }
}

const onTabChange = (index) => {
  const days = index + 1
  fetchExpiringItems(days)
}

const getExpiryType = (daysLeft) => {
  if (daysLeft <= 1) return 'danger'
  if (daysLeft <= 3) return 'warning'
  return 'primary'
}

onMounted(() => {
  fetchExpiringItems(1)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.tabs-container {
  background-color: #fff;
  margin-bottom: 10px;
}

.content {
  padding: 10px 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 50px 0;
}
</style>
