<template>
  <div class="warehouse-page">
    <van-nav-bar title="仓库管理" left-arrow @click-left="goBack" />
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadWarehouses"
    >
      <van-cell
        v-for="warehouse in warehouses"
        :key="warehouse.id"
        :title="warehouse.name"
        :label="warehouse.description"
      />
    </van-list>
    <div class="add-button">
      <van-button type="primary" block @click="showAddDialog = true">
        添加仓库
      </van-button>
    </div>
    <van-dialog
      v-model:show="showAddDialog"
      title="添加仓库"
      show-cancel-button
      @confirm="addWarehouse"
    >
      <van-cell-group inset>
        <van-field
          v-model="newWarehouse.name"
          label="名称"
          placeholder="请输入仓库名称"
        />
        <van-field
          v-model="newWarehouse.description"
          label="描述"
          placeholder="请输入仓库描述"
        />
      </van-cell-group>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import axios from '@/utils/axios'

const router = useRouter()

const warehouses = ref([])
const loading = ref(false)
const finished = ref(false)
const showAddDialog = ref(false)
const newWarehouse = ref({
  name: '',
  description: ''
})

const goBack = () => {
  router.back()
}

const loadWarehouses = async () => {
  try {
    const response = await axios.get('/api/warehouses')
    warehouses.value = response.data.data || response.data
    finished.value = true
  } catch (error) {
    showToast('加载失败')
    finished.value = true
  } finally {
    loading.value = false
  }
}

const addWarehouse = async () => {
  if (!newWarehouse.value.name) {
    showToast('请输入仓库名称')
    return
  }

  try {
    await axios.post('/api/warehouses', newWarehouse.value)
    showToast('添加成功')
    newWarehouse.value = { name: '', description: '' }
    loadWarehouses()
  } catch (error) {
    showToast(error.response?.data?.message || '添加失败')
  }
}

onMounted(() => {
  loadWarehouses()
})
</script>

<style scoped>
.warehouse-page {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 70px;
}

.add-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 16px;
  background-color: #fff;
}
</style>
