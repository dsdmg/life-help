<template>
  <div class="item-page">
    <van-nav-bar title="物品管理" left-arrow @click-left="goBack" />
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadItems"
    >
      <van-cell
        v-for="item in items"
        :key="item.id"
        :title="item.name"
        :label="itemLabel(item)"
        is-link
        @click="openEdit(item)"
      />
    </van-list>
    <div class="add-button">
      <van-button type="primary" block @click="openAdd">添加物品</van-button>
    </div>
    <van-popup v-model:show="showAddDialog" position="bottom" round>
      <div class="popup-content">
        <div class="popup-header">
          <div class="popup-title">{{ isEdit ? '编辑物品' : '添加物品' }}</div>
        </div>
        <van-cell-group inset>
          <van-field
            v-model="formItem.name"
            label="名称"
            placeholder="请输入物品名称"
          />
          <van-field
            v-model="formItem.category"
            label="分类"
            placeholder="请输入分类"
          />
          <van-field
            v-model="formItem.unit"
            label="单位"
            placeholder="请输入单位"
          />
          <van-field
            v-model="formItem.shelf_life"
            type="number"
            label="保质期(天)"
            placeholder="请输入保质期天数"
          />
        </van-cell-group>
        <div class="popup-footer">
          <van-button block @click="showAddDialog = false">取消</van-button>
          <van-button type="primary" block @click="handleConfirm">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import axios from '@/utils/axios';

const router = useRouter();

const items = ref([]);
const loading = ref(false);
const finished = ref(false);
const showAddDialog = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const formItem = ref({
  name: '',
  category: '',
  unit: '',
  shelf_life: ''
});

const itemLabel = (item) => {
  const parts = [];
  parts.push(item.category || '未分类');
  parts.push(item.unit || '无单位');
  if (item.shelf_life !== undefined && item.shelf_life !== null && item.shelf_life !== '') {
    parts.push(`保质期:${item.shelf_life}天`);
  }
  return parts.join(' | ');
};

const goBack = () => {
  router.back();
};

const loadItems = async () => {
  try {
    console.log('开始加载物品列表');
    const response = await axios.get('/api/items');
    console.log('获取物品成功:', response.data);
    items.value = response.data.data || response.data;
    console.log('当前物品列表:', items.value);
    finished.value = true;
  } catch (error) {
    console.error('加载物品失败:', error);
    showToast('加载失败');
    finished.value = true;
  } finally {
    loading.value = false;
  }
};

const openAdd = () => {
  isEdit.value = false;
  editId.value = null;
  formItem.value = {
    name: '',
    category: '',
    unit: '',
    shelf_life: ''
  };
  showAddDialog.value = true;
};

const openEdit = (item) => {
  console.log('点击编辑物品:', item);
  isEdit.value = true;
  editId.value = item.id;
  formItem.value = {
    name: item.name,
    category: item.category || '',
    unit: item.unit || '',
    shelf_life: item.shelf_life !== undefined && item.shelf_life !== null ? String(item.shelf_life) : ''
  };
  showAddDialog.value = true;
};

const handleConfirm = () => {
  console.log('点击确定按钮, isEdit:', isEdit.value);
  if (isEdit.value) {
    updateItem();
  } else {
    addItem();
  }
};

const addItem = async () => {
  console.log('开始添加物品', formItem.value);
  if (!formItem.value.name) {
    showToast('请输入物品名称');
    return;
  }

  try {
    const payload = {
      ...formItem.value,
      shelf_life: formItem.value.shelf_life !== '' ? Number(formItem.value.shelf_life) : null
    };
    console.log('提交数据:', payload);
    const response = await axios.post('/api/items', payload);
    console.log('添加成功:', response.data);
    showToast('添加成功');
    showAddDialog.value = false;
    loadItems();
  } catch (error) {
    console.error('添加物品失败:', error);
    showToast(error.response?.data?.error || '添加失败');
  }
};

const updateItem = async () => {
  console.log('开始更新物品', formItem.value);
  if (!formItem.value.name) {
    showToast('请输入物品名称');
    return;
  }

  try {
    const payload = {
      ...formItem.value,
      shelf_life: formItem.value.shelf_life !== '' ? Number(formItem.value.shelf_life) : null
    };
    console.log('提交数据:', payload);
    const response = await axios.put(`/api/items/${editId.value}`, payload);
    console.log('更新成功:', response.data);
    showToast('更新成功');
    showAddDialog.value = false;
    loadItems();
  } catch (error) {
    console.error('更新物品失败:', error);
    showToast(error.response?.data?.error || '更新失败');
  }
};

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.item-page {
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

.popup-content {
  padding: 0 0 16px 0;
  max-height: 70vh;
  overflow-y: auto;
}

.popup-header {
  padding: 16px;
  text-align: center;
  font-weight: 600;
  font-size: 16px;
}

.popup-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
}

.popup-footer button {
  flex: 1;
}
</style>
