# 生活助手系统 - Ubuntu 部署文档

## 一、系统概述

本项目为前后端分离的生活助手管理系统，包含：

- **前端**：Vue 3 + Vite + Vant，移动端优先的库存管理界面
- **后端**：Express + SQLite，提供 RESTful API

### 部署架构

```
用户浏览器 (HTTPS)
    ↓
Nginx (端口 443，SSL终止)
    ↓
├── / (静态资源) → 前端构建文件
└── /api/* → 反向代理 → 后端服务 (localhost:3000)
```

***

## 二、服务器要求

- **操作系统**：Ubuntu 20.04 LTS 或更高版本
- **配置**：1核1G以上（推荐2核2G）
- **域名**：已解析到服务器IP的域名（yoouur.xyz, [www.yoouur.xyz）](http://www.yoouur.xyz）)

***

## 三、前置准备

### 1. 更新系统软件包

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 安装必要软件

```bash
sudo apt install -y nginx git curl build-essential
```

### 3. 安装 Node.js 18.x

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # 确认版本
```

### 4. 创建项目目录

```bash
sudo mkdir -p /var/www/grydd
sudo chown -R $USER:$USER /var/www/grydd
```

***

## 四、后端部署

### 1. 上传后端代码

将 `backend` 目录上传至服务器 `/var/www/grydd/backend`

```bash
cd /var/www/grydd
# 如果使用 git
git clone <your-repo-url> .
# 或手动复制
scp -r ./backend user@your-server:/var/www/grydd/
```

### 2. 安装后端依赖

```bash
cd /var/www/grydd/backend
npm install
```

### 3. 初始化数据库

```bash
# 检查数据库文件是否存在
ls -la data/

# 如需初始化默认用户，执行
node src/init-user.js
```

### 4. 使用 PM2 管理后端进程

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动后端服务
pm2 start src/app.js --name life-help-backend

# 设置开机自启
pm2 save
pm2 startup
```

### 5. 验证后端服务

```bash
# 检查服务状态
pm2 status life-help-backend
# 查看 PM2 日志
pm2 logs life-help-backend --lines 50

# 检查端口 3000 是否被占用
netstat -tlnp | grep 3000

# 或用 ss 命令
ss -tlnp | grep 3000
# 测试 API
curl http://localhost:3000/api/login
# 应返回 {"error":"未提供认证令牌"} 或类似响应
```

***

## 五、前端部署

### 1. 在本地构建（推荐）

```bash
cd d:\ProjectMy\life-help\frontend
npm install
npm run build
```

构建完成后，`dist` 目录即为部署文件。

### 2. 上传前端构建文件

将 `dist` 目录上传至服务器：

```bash
scp -r ./dist user@your-server:/var/www/grydd/
```

### 3. 或者在服务器上构建

```bash
cd /var/www/grydd/frontend
npm install
npm run build
# 构建产物会在 dist 目录
```

***

## 六、Nginx 配置

### 1. 上传 Nginx 配置文件

将 `nginx.conf` 内容复制到服务器：

```bash
sudo cp /var/www/grydd/frontend/nginx.conf /etc/nginx/sites-available/life-help
sudo ln -s /etc/nginx/sites-available/life-help /etc/nginx/sites-enabled/life-help
```

### 2. 编辑 Nginx 配置

根据实际情况修改以下配置：

```bash
sudo nano /etc/nginx/sites-available/life-help
```

**需要检查/修改的关键配置：**

| 配置项                   | 当前值                            | 说明                      |
| --------------------- | ------------------------------ | ----------------------- |
| `root`                | `/var/www/grydd/dist`          | 前端构建文件路径                |
| `proxy_pass`          | `http://127.0.0.1:3000/`       | 后端 API 地址（与 Nginx 同机部署） |
| `ssl_certificate`     | `/etc/ssl/cert/yoouur.xyz.pem` | SSL 证书路径                |
| `ssl_certificate_key` | `/etc/ssl/cert/yoouur.xyz.key` | SSL 私钥路径                |
| `server_name`         | `yoouur.xyz www.yoouur.xyz`    | 域名                      |

### 3. 测试并重载 Nginx

```bash
# 测试配置语法
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

***

## 七、SSL 证书配置

### 证书文件位置

```
/etc/ssl/cert/
├── yoouur.xyz.pem    # 证书文件（含中间证书）
└── yoouur.xyz.key    # 私钥文件
```

### 申请 Let's Encrypt 免费证书（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书（请先确保域名已解析到服务器）
sudo certbot --nginx -d yoouur.xyz -d www.yoouur.xyz

# 自动续期测试
sudo certbot renew --dry-run
```

### 手动配置已有证书

将证书文件复制到对应目录：

```bash
sudo cp your-certificate.pem /etc/ssl/cert/yoouur.xyz.pem
sudo cp your-private-key.key /etc/ssl/cert/yoouur.xyz.key
sudo chmod 600 /etc/ssl/cert/yoouur.xyz.key
```

***

## 八、防火墙配置

```bash
# 检查防火墙状态
sudo ufw status

# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# 启用防火墙
sudo ufw enable
```

***

## 九、验证部署

### 1. 检查服务状态

```bash
# Nginx 状态
sudo systemctl status nginx

# 后端服务状态
pm2 status life-help-backend
```

### 2. 访问测试

| 测试地址                                | 预期结果           |
| ----------------------------------- | -------------- |
| `https://yoouur.xyz`                | 显示前端登录页面       |
| `https://yoouur.xyz/api/warehouses` | 返回 401 未授权（正常） |
| `https://yoouur.xyz/api/login`      | 返回 401 未授权（正常） |

### 3. 登录测试

1. 访问 `https://yoouur.xyz`
2. 使用默认账号登录（默认用户名：`admin`，密码：`admin123`）
3. 验证首页、各功能页面是否正常加载

***

## 十、常见问题排查

### 1. 前端页面空白或 404

```bash
# 检查 dist 目录是否存在且有内容
ls -la /var/www/grydd/dist/

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 2. API 请求失败

```bash
# 检查后端是否运行
curl http://localhost:3000/api/login

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/access.log

# 检查后端日志
pm2 logs life-help-backend
```

### 3. SSL 证书错误

```bash
# 检查证书文件是否存在
ls -la /etc/ssl/cert/yoouur.xyz.pem
ls -la /etc/ssl/cert/yoouur.xyz.key

# 检查证书有效期
openssl x509 -in /etc/ssl/cert/yoouur.xyz.pem -noout -dates
```

### 4. bcrypt 模块编译错误

**现象**：PM2 显示服务 online，但无法连接端口，日志中出现类似错误：

```
Error: /var/www/grydd/backend/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header
```

**原因**：bcrypt 是原生模块，需要在目标服务器上编译。如果在 Windows 或其他系统上安装依赖后再复制到 Linux 服务器，就会出现此错误。

**解决方案**：

```bash
# 1. 停止后端服务
pm2 stop life-help-backend

# 2. 删除旧的依赖
cd /var/www/grydd/backend
rm -rf node_modules package-lock.json

# 3. 重新安装依赖（在目标服务器上编译）
npm install

# 4. 重启服务
pm2 restart life-help-backend

# 5. 验证服务是否正常
curl http://localhost:3000/api/login
# 应返回 {"error":"未提供认证令牌"}
```

**替代方案**：如果仍有问题，改用纯 JavaScript 实现的 bcryptjs

```bash
npm uninstall bcrypt
npm install bcryptjs
```

然后修改 `backend/src/app.js`：

```javascript
// 将
import bcrypt from 'bcrypt';
// 改为
import bcrypt from 'bcryptjs';
```

***

## 十一、日常维护

### 查看日志

```bash
# 后端日志
pm2 logs life-help-backend --lines 100

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 重启服务

```bash
# 重启后端
pm2 restart life-help-backend

# 重载 Nginx
sudo nginx -s reload
```

### 更新部署

```bash
# 1. 备份当前版本
cp -r /var/www/grydd/dist /var/www/grydd/dist.bak

# 2. 上传新版前端构建文件
scp -r ./dist user@your-server:/var/www/grydd/

# 3. 重启后端（如有更新）
cd /var/www/grydd/backend
git pull
npm install
pm2 restart life-help-backend
```

***

## 十二、部署检查清单

- [ ] 服务器系统已更新
- [ ] 已安装 Nginx、Node.js、PM2
- [ ] 后端代码已部署至 `/var/www/grydd/backend`
- [ ] 后端依赖已安装
- [ ] PM2 已配置并启动后端服务
- [ ] 前端构建文件已部署至 `/var/www/grydd/dist`
- [ ] Nginx 配置文件已配置并启用
- [ ] SSL 证书已配置
- [ ] 防火墙已开放 80/443 端口
- [ ] 域名已正确解析
- [ ] 部署验证测试通过

