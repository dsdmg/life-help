# Checklist

## 项目结构验证
- [x] backend/package.json 存在且依赖配置正确
- [x] backend/src/database.js 存在且数据库表创建正确
- [x] backend/src/app.js 存在且API路由配置正确
- [x] frontend/package.json 存在且依赖配置正确
- [x] frontend/vite.config.js 存在且代理配置正确
- [x] frontend/index.html 存在
- [x] frontend/src/main.js 存在且正确引入Vue、Router、Pinia、Vant
- [x] frontend/src/App.vue 存在

## 路由与状态管理验证
- [x] frontend/src/router/index.js 存在且路由配置正确
- [x] frontend/src/stores/user.js 存在且用户状态管理正确

## 页面验证
- [x] frontend/src/views/Login.vue 存在且登录功能实现
- [x] frontend/src/views/Home.vue 存在且导航功能实现
- [x] frontend/src/views/Warehouse.vue 存在且仓库管理功能实现
- [x] frontend/src/views/Item.vue 存在且物品管理功能实现
- [x] frontend/src/views/Inventory.vue 存在且库存查询功能实现
- [x] frontend/src/views/Record.vue 存在且出入库记录功能实现

## API验证
- [x] POST /api/login 登录接口可用
- [x] GET /api/warehouses 获取仓库列表接口可用
- [x] POST /api/warehouses 添加仓库接口可用
- [x] GET /api/items 获取物品列表接口可用
- [x] POST /api/items 添加物品接口可用
- [x] GET /api/inventory 获取库存列表接口可用
- [x] POST /api/records 添加出入库记录接口可用
- [x] GET /api/records 获取出入库记录接口可用

## 数据库验证
- [x] users 表创建成功
- [x] warehouses 表创建成功
- [x] items 表创建成功
- [x] inventory 表创建成功
- [x] records 表创建成功
