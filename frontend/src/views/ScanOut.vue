<template>
  <div class="scan-out-page">
    <van-nav-bar title="扫描出库" left-arrow @click-left="goBack" />
    
    <van-steps :active="activeStep" active-color="#07c160">
      <van-step>扫描条码</van-step>
      <van-step>选择库存</van-step>
      <van-step>确认出库</van-step>
    </van-steps>

    <div class="content-area">
      <div v-if="activeStep === 0" class="step-content">
        <van-cell-group inset>
          <van-field
            v-model="searchKeyword"
            label="条码/名称"
            placeholder="请输入或扫描条码/名称"
          >
            <template #button>
              <van-button size="small" type="primary" icon="scan" @click="openScanner">
                扫描
              </van-button>
            </template>
          </van-field>
        </van-cell-group>
        <div class="search-btn">
          <van-button type="primary" block @click="searchItem" :loading="searching">
            查询物品
          </van-button>
        </div>
      </div>

      <div v-if="activeStep === 1" class="step-content">
        <van-cell-group inset title="物品信息">
          <van-cell title="物品名称" :value="currentItem?.name" />
          <van-cell title="分类" :value="currentItem?.category || '未分类'" />
          <van-cell title="单位" :value="currentItem?.unit || '无'" />
        </van-cell-group>

        <van-cell-group inset title="选择库存">
          <van-radio-group v-model="selectedInventoryId">
            <van-cell
              v-for="inv in inventoryList"
              :key="inv.id"
              clickable
              @click="selectedInventoryId = inv.id"
            >
              <template #title>
                <div class="inventory-info">
                  <div class="warehouse-name">{{ inv.warehouse_name }}</div>
                  <div class="batch-info">批号: {{ inv.batch_number || '无' }}</div>
                </div>
              </template>
              <template #value>
                <span class="quantity">{{ inv.quantity }} {{ currentItem?.unit || '' }}</span>
              </template>
              <template #right-icon>
                <van-radio :name="inv.id" />
              </template>
            </van-cell>
          </van-radio-group>
        </van-cell-group>
        <div class="step-actions">
          <van-button block @click="activeStep = 0">上一步</van-button>
          <van-button type="primary" block @click="goToStep3" :disabled="!selectedInventoryId">
            下一步
          </van-button>
        </div>
      </div>

      <div v-if="activeStep === 2" class="step-content">
        <van-cell-group inset title="出库信息">
          <van-cell title="物品名称" :value="currentItem?.name" />
          <van-cell title="仓库" :value="selectedInventory?.warehouse_name" />
          <van-cell title="批号" :value="selectedInventory?.batch_number || '无'" />
          <van-cell title="可用库存" :value="`${selectedInventory?.quantity} ${currentItem?.unit || ''}`" />
        </van-cell-group>

        <van-cell-group inset title="出库数量">
          <van-field
            v-model="outQuantity"
            type="number"
            label="出库数量"
            :placeholder="`最大可出库: ${selectedInventory?.quantity}`"
          >
            <template #button>
              <van-button size="small" @click="outQuantity = selectedInventory?.quantity">
                全部
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <van-cell-group inset title="备注">
          <van-field
            v-model="remark"
            rows="2"
            autosize
            type="textarea"
            placeholder="请输入备注信息"
          />
        </van-cell-group>

        <div class="step-actions">
          <van-button block @click="activeStep = 1">上一步</van-button>
          <van-button type="primary" block @click="confirmOut" :loading="submitting">
            确认出库
          </van-button>
        </div>
      </div>
    </div>

    <ScanQRCode
      v-if="showScanner"
      :visible="showScanner"
      @close="showScanner = false"
      @success="onScanSuccess"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import axios from '@/utils/axios';
import ScanQRCode from '@/components/ScanQRCode.vue';

const router = useRouter();

const activeStep = ref(0);
const showScanner = ref(false);
const searchKeyword = ref('');
const searching = ref(false);
const submitting = ref(false);

const currentItem = ref(null);
const inventoryList = ref([]);
const selectedInventoryId = ref(null);
const outQuantity = ref('');
const remark = ref('');

const selectedInventory = computed(() => {
  return inventoryList.value.find(inv => inv.id === selectedInventoryId.value);
});

const goBack = () => {
  if (activeStep.value > 0) {
    activeStep.value--;
  } else {
    router.back();
  }
};

const openScanner = () => {
  showScanner.value = true;
};

const onScanSuccess = (result) => {
  searchKeyword.value = result;
  showScanner.value = false;
  searchItem();
};

const searchItem = async () => {
  if (!searchKeyword.value.trim()) {
    showToast('请输入或扫描条码/名称');
    return;
  }

  searching.value = true;
  try {
    const response = await axios.get('/api/items/search', {
      params: { keyword: searchKeyword.value.trim() }
    });
    const items = response.data.data || response.data;

    if (!items || items.length === 0) {
      showToast('未找到匹配的物品');
      return;
    }

    currentItem.value = items[0];

    const invResponse = await axios.get('/api/inventory');
    const allInventory = invResponse.data.data || invResponse.data;
    inventoryList.value = allInventory.filter(inv => inv.item_id === currentItem.value.id && inv.quantity > 0);

    if (inventoryList.value.length === 0) {
      showToast('该物品没有可用库存');
      return;
    }

    if (inventoryList.value.length === 1) {
      selectedInventoryId.value = inventoryList.value[0].id;
      outQuantity.value = String(inventoryList.value[0].quantity);
      activeStep.value = 2;
    } else {
      activeStep.value = 1;
    }
  } catch (error) {
    console.error('查询失败:', error);
    showToast(error.response?.data?.error || '查询失败');
  } finally {
    searching.value = false;
  }
};

const goToStep3 = () => {
  if (!selectedInventoryId.value) {
    showToast('请选择库存');
    return;
  }
  outQuantity.value = String(selectedInventory.value?.quantity || 0);
  activeStep.value = 2;
};

const confirmOut = async () => {
  const qty = parseInt(outQuantity.value);
  const maxQty = selectedInventory.value?.quantity || 0;

  if (!qty || qty <= 0) {
    showToast('请输入有效的出库数量');
    return;
  }

  if (qty > maxQty) {
    showToast(`出库数量不能超过 ${maxQty}`);
    return;
  }

  try {
    await showConfirmDialog({
      title: '确认出库',
      message: `确定要从 ${selectedInventory.value?.warehouse_name} 出库 ${qty} ${currentItem.value?.unit || ''} ${currentItem.value?.name} 吗？`,
    });

    submitting.value = true;
    await axios.post('/api/records', {
      type: 'out',
      warehouse_id: selectedInventory.value.warehouse_id,
      item_id: currentItem.value.id,
      quantity: qty,
      batch_number: selectedInventory.value.batch_number,
      remark: remark.value
    });

    showToast('出库成功');
    resetForm();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('出库失败:', error);
      showToast(error.response?.data?.error || '出库失败');
    }
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  activeStep.value = 0;
  searchKeyword.value = '';
  currentItem.value = null;
  inventoryList.value = [];
  selectedInventoryId.value = null;
  outQuantity.value = '';
  remark.value = '';
};
</script>

<style scoped>
.scan-out-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content-area {
  padding: 16px;
}

.step-content {
  margin-top: 16px;
}

.search-btn {
  margin-top: 16px;
  padding: 0 16px;
}

.inventory-info {
  display: flex;
  flex-direction: column;
}

.warehouse-name {
  font-weight: 500;
}

.batch-info {
  font-size: 12px;
  color: #666;
}

.quantity {
  font-weight: bold;
  color: #1989fa;
}

.step-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 0 16px;
}

.step-actions button {
  flex: 1;
}
</style>
