<template>
  <div class="record-page">
    <van-nav-bar title="出入库记录" left-arrow @click-left="goBack" />
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadRecords"
    >
      <van-cell
        v-for="record in records"
        :key="record.id"
        :title="record.item_name"
        :label="record.warehouse_name"
      >
        <template #value>
          <span :class="['quantity', record.type]">
            {{ record.type === 'in' ? '+' : '-' }}{{ record.quantity }}
          </span>
        </template>
        <template #label>
          <div>{{ record.warehouse_name }}</div>
          <div v-if="record.batch_number" class="detail">批号: {{ record.batch_number }}</div>
          <div v-if="record.shelf_life" class="detail">保质期: {{ record.shelf_life }}天</div>
          <div v-if="record.remark" class="detail">{{ record.remark }}</div>
        </template>
      </van-cell>
    </van-list>
    <div class="add-button">
      <van-button type="primary" block @click="showAddDialog = true">
        添加记录
      </van-button>
    </div>
    <van-dialog
      v-model:show="showAddDialog"
      title="添加记录"
      show-cancel-button
      @confirm="addRecord"
    >
      <van-cell-group inset>
        <van-field label="类型">
          <template #input>
            <van-radio-group v-model="newRecord.type" direction="horizontal">
              <van-radio name="in">入库</van-radio>
              <van-radio name="out">出库</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field
          v-model="selectedWarehouseName"
          label="仓库"
          placeholder="请选择仓库"
          readonly
          right-icon="arrow-right"
          @click="showWarehousePicker = true"
        />
        <van-field
          v-model="selectedItemName"
          label="物品"
          placeholder="请选择物品"
          readonly
          right-icon="arrow-right"
          @click="showItemPicker = true"
        />
        <van-field
          v-model="newRecord.quantity"
          type="number"
          label="数量"
          placeholder="请输入数量"
        />
        <van-field
          v-model="newRecord.batch_number"
          label="批号"
          placeholder="请输入批号"
        />
        <van-field
          v-model="newRecord.shelf_life"
          type="number"
          label="保质期(天)"
          placeholder="请输入保质期天数"
        />
        <van-field
          v-model="newRecord.remark"
          label="备注"
          placeholder="请输入备注"
        />
      </van-cell-group>
    </van-dialog>
    <van-action-sheet
      v-model:show="showWarehousePicker"
      title="选择仓库"
      cancel-text="取消"
      @cancel="showWarehousePicker = false"
    >
      <van-cell-group>
        <van-cell
          v-for="warehouse in warehouses"
          :key="warehouse.id"
          :title="warehouse.name"
          @click="selectWarehouse(warehouse)"
        />
      </van-cell-group>
    </van-action-sheet>
    <van-action-sheet
      v-model:show="showItemPicker"
      title="选择物品"
      cancel-text="取消"
      @cancel="showItemPicker = false"
    >
      <van-cell-group>
        <van-cell
          v-for="item in items"
          :key="item.id"
          :title="item.name"
          :label="item.category || '未分类'"
          @click="selectItem(item)"
        />
      </van-cell-group>
    </van-action-sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import axios from '@/utils/axios'

const router = useRouter()

const records = ref([])
const warehouses = ref([])
const items = ref([])
const loading = ref(false)
const finished = ref(false)
const showAddDialog = ref(false)
const showWarehousePicker = ref(false)
const showItemPicker = ref(false)
const newRecord = ref({
  type: 'in',
  warehouse_id: '',
  item_id: '',
  quantity: '',
  batch_number: '',
  shelf_life: '',
  remark: ''
})
const selectedWarehouseName = ref('')
const selectedItemName = ref('')

const goBack = () => {
  router.back()
}

const loadRecords = async () => {
  try {
    const response = await axios.get('/api/records')
    records.value = response.data.data || response.data
    finished.value = true
  } catch (error) {
    showToast('加载失败')
    finished.value = true
  } finally {
    loading.value = false
  }
}

const loadWarehouses = async () => {
  try {
    const response = await axios.get('/api/warehouses')
    warehouses.value = response.data.data || response.data
  } catch (error) {
    console.error('加载仓库失败')
  }
}

const loadItems = async () => {
  try {
    const response = await axios.get('/api/items')
    items.value = response.data.data || response.data
  } catch (error) {
    console.error('加载物品失败')
  }
}

const selectWarehouse = (warehouse) => {
  newRecord.value.warehouse_id = warehouse.id
  selectedWarehouseName.value = warehouse.name
  showWarehousePicker.value = false
}

const selectItem = (item) => {
  newRecord.value.item_id = item.id
  selectedItemName.value = item.name
  if (item.shelf_life) {
    newRecord.value.shelf_life = item.shelf_life
  }
  showItemPicker.value = false
}

const addRecord = async () => {
  if (!newRecord.value.item_id) {
    showToast('请选择物品')
    return
  }
  if (!newRecord.value.warehouse_id) {
    showToast('请选择仓库')
    return
  }
  if (!newRecord.value.quantity) {
    showToast('请输入数量')
    return
  }

  try {
    await axios.post('/api/records', {
      type: newRecord.value.type,
      warehouse_id: newRecord.value.warehouse_id,
      item_id: newRecord.value.item_id,
      quantity: Number(newRecord.value.quantity),
      batch_number: newRecord.value.batch_number,
      shelf_life: newRecord.value.shelf_life || null,
      remark: newRecord.value.remark
    })
    showToast('添加成功')
    newRecord.value = {
      type: 'in',
      warehouse_id: '',
      item_id: '',
      quantity: '',
      batch_number: '',
      shelf_life: '',
      remark: ''
    }
    selectedWarehouseName.value = ''
    selectedItemName.value = ''
    loadRecords()
  } catch (error) {
    showToast(error.response?.data?.error || '添加失败')
  }
}

onMounted(() => {
  loadRecords()
  loadWarehouses()
  loadItems()
})
</script>

<style scoped>
.record-page {
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

.quantity {
  font-weight: bold;
}

.quantity.in {
  color: #07c160;
}

.quantity.out {
  color: #ee0a24;
}

.detail {
  color: #969799;
  font-size: 12px;
}
</style>
