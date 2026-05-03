# 库存管理软件 Spec

## Why
需要一个轻量级的库存管理系统，用于管理家庭日常物品的存储情况，包括冰箱、橱柜等仓库中物品的出入库记录和库存查询。

## What Changes
- 创建 Vue 3 + Vite + Vant 4 前端项目
- 创建 Express + SQLite 后端项目
- 实现用户登录认证功能
- 实现仓库管理功能（冰箱、橱柜等）
- 实现物品管理功能（笔、苹果、香蕉等）
- 实现库存查询功能
- 实现出入库记录功能

## Impact
- 新建项目：frontend/（前端Vue项目）
- 新建项目：backend/（后端API服务）
- 数据库：SQLite嵌入式数据库

## ADDED Requirements

### Requirement: 用户认证
系统应提供用户登录功能，保护库存数据安全。

#### Scenario: 登录成功
- **WHEN** 用户输入正确的用户名和密码
- **THEN** 系统返回成功并跳转到首页

#### Scenario: 登录失败
- **WHEN** 用户输入错误的用户名或密码
- **THEN** 系统提示错误信息

### Requirement: 仓库管理
系统应允许用户管理仓库信息。

#### Scenario: 添加仓库
- **WHEN** 用户提交仓库名称（如：冰箱、橱柜）
- **THEN** 系统创建新仓库记录

#### Scenario: 查看仓库列表
- **WHEN** 用户访问仓库管理页面
- **THEN** 系统显示所有仓库列表

### Requirement: 物品管理
系统应允许用户管理物品信息。

#### Scenario: 添加物品
- **WHEN** 用户提交物品名称、分类、单位
- **THEN** 系统创建新物品记录

#### Scenario: 查看物品列表
- **WHEN** 用户访问物品管理页面
- **THEN** 系统显示所有物品列表

### Requirement: 库存查询
系统应允许用户查询各仓库的物品库存。

#### Scenario: 查看库存
- **WHEN** 用户访问库存查询页面
- **THEN** 系统显示各仓库物品库存数量

### Requirement: 出入库管理
系统应允许用户记录物品的出入库操作。

#### Scenario: 入库操作
- **WHEN** 用户提交入库记录（仓库、物品、数量）
- **THEN** 系统增加该仓库该物品的库存数量

#### Scenario: 出库操作
- **WHEN** 用户提交出库记录（仓库、物品、数量）
- **THEN** 系统减少该仓库该物品的库存数量

## 技术选型

| 分类 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 | 组合式API |
| 构建工具 | Vite | 快速构建 |
| UI组件 | Vant 4 | 移动端UI |
| 路由 | Vue Router | 路由管理 |
| 状态管理 | Pinia | 状态管理 |
| HTTP客户端 | Axios | API请求 |
| 后端框架 | Express | Node.js框架 |
| 数据库 | SQLite | 嵌入式数据库 |

## 数据库表结构

### users（用户表）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 用户ID |
| username | VARCHAR(50) | NOT NULL UNIQUE | 用户名 |
| password | VARCHAR(255) | NOT NULL | 密码 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### warehouses（仓库表）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 仓库ID |
| name | VARCHAR(50) | NOT NULL | 仓库名称 |
| description | VARCHAR(200) | | 描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### items（物品表）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 物品ID |
| name | VARCHAR(50) | NOT NULL | 物品名称 |
| category | VARCHAR(50) | | 分类 |
| unit | VARCHAR(20) | DEFAULT '个' | 单位 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### inventory（库存表）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 库存ID |
| warehouse_id | INTEGER | FOREIGN KEY | 仓库ID |
| item_id | INTEGER | FOREIGN KEY | 物品ID |
| quantity | DECIMAL(10,2) | DEFAULT 0 | 数量 |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### records（出入库记录表）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY | 记录ID |
| type | VARCHAR(20) | NOT NULL | 类型(in/out) |
| warehouse_id | INTEGER | FOREIGN KEY | 仓库ID |
| item_id | INTEGER | FOREIGN KEY | 物品ID |
| quantity | DECIMAL(10,2) | NOT NULL | 数量 |
| operator | VARCHAR(50) | NOT NULL | 操作人 |
| remark | VARCHAR(200) | | 备注 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
