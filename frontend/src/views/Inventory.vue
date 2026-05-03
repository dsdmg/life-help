<template>
  <div class="inventory-page">
    <van-nav-bar title="库存查询" left-arrow @click-left="goBack" />
    <van-dropdown-menu>
      <van-dropdown-item v-model="selectedWarehouse" :options="warehouseOptions" @change="loadInventory" />
    </van-dropdown-menu>
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadInventory"
    >
      <van-cell
        v-for="inventory in inventories"
        :key="inventory.id"
        :title="inventory.item_name"
        :label="inventory.warehouse_name"
      >
        <template #value>
          <span class="quantity">{{ inventory.quantity }} {{ inventory.unit || '' }}</span>
        </template>
      </van-cell>
    </van-list>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import axios from '@/utils/axios'

const router = useRouter()

const inventories = ref([])
const warehouses = ref([])
const selectedWarehouse = ref(0)
const loading = ref(false)
const finished = ref(false)

const warehouseOptions = computed(() => {
  const options = [{ text: '全部仓库', value: 0 }]
  warehouses.value.forEach(w => {
    options.push({ text: w.name, value: w.id })
  })
  return options
})

const goBack = () => {
  router.back()
}

const loadWarehouses = async () => {
  try {
    const response = await axios.get('/api/warehouses')
    warehouses.value = response.data.data || response.data
  } catch (error) {
    console.error('加载仓库失败')
  }
}

const loadInventory = async () => {
  try {
    const params = {}
    if (selectedWarehouse.value) {
      params.warehouse_id = selectedWarehouse.value
    }
    const response = await axios.get('/api/inventory', { params })
    inventories.value = response.data.data || response.data
    finished.value = true
  } catch (error) {
    showToast('加载失败')
    finished.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWarehouses()
  loadInventory()
})
</script>

<style scoped>
.inventory-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.quantity {
  font-weight: bold;
  color: #1989fa;
}
</style>
