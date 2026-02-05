# 部署后端到 Cloudflare Workers

## 为什么 APP 没有数据？

前端 APP 需要从后端 API 获取音乐数据，但后端还没有部署。

前端代码中的 API 地址：
```javascript
const API_BASE = 'https://music-crawler.sky70old.workers.dev'
```

## 快速部署步骤

### 方式一：使用 Cloudflare Workers（推荐，免费）

#### 1. 注册 Cloudflare 账号
- 访问 https://dash.cloudflare.com/sign-up
- 免费注册一个账号

#### 2. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

#### 3. 登录 Cloudflare
```bash
wrangler login
```
会打开浏览器，授权登录

#### 4. 部署后端
```bash
cd backend
wrangler deploy
```

#### 5. 获取部署地址
部署成功后会显示类似：
```
Published music-crawler (1.23 sec)
  https://music-crawler.YOUR_SUBDOMAIN.workers.dev
```

#### 6. 更新前端 API 地址
编辑以下两个文件，替换 API_BASE：

**frontend/src/views/Home.vue**
```javascript
const API_BASE = 'https://music-crawler.YOUR_SUBDOMAIN.workers.dev'
```

**frontend/src/views/Search.vue**
```javascript
const API_BASE = 'https://music-crawler.YOUR_SUBDOMAIN.workers.dev'
```

#### 7. 重新构建并推送
```bash
cd frontend
npm run build
npx cap sync android

cd ..
git add .
git commit -m "Update API endpoint"
git push
```

等待 GitHub Actions 重新构建 APK（约 5-10 分钟）

---

### 方式二：使用现有的测试后端（临时）

如果你不想部署后端，可以先使用我提供的测试后端：

**注意：这只是临时测试用，不保证稳定性！**

前端 API 地址已经设置为：
```
https://music-crawler.sky70old.workers.dev
```

如果这个地址可用，APP 应该能正常显示数据。

---

## 详细部署教程

### 步骤 1：准备 Cloudflare 账号

1. 访问 https://dash.cloudflare.com/sign-up
2. 使用邮箱注册（免费）
3. 验证邮箱

### 步骤 2：安装 Wrangler

```bash
# 全局安装
npm install -g wrangler

# 验证安装
wrangler --version
```

### 步骤 3：登录

```bash
wrangler login
```

会打开浏览器，点击"Allow"授权

### 步骤 4：部署

```bash
cd backend
wrangler deploy
```

首次部署会询问一些问题，全部选择默认即可。

### 步骤 5：测试后端

部署成功后，测试 API：

```bash
# 测试榜单接口
curl https://music-crawler.YOUR_SUBDOMAIN.workers.dev/api/rank/hot-music

# 测试搜索接口
curl https://music-crawler.YOUR_SUBDOMAIN.workers.dev/api/search?keyword=周杰伦
```

如果返回 JSON 数据，说明部署成功！

### 步骤 6：更新前端

1. 复制你的 Workers 地址
2. 编辑 `frontend/src/views/Home.vue` 和 `frontend/src/views/Search.vue`
3. 替换 `API_BASE` 为你的地址
4. 重新构建并推送

---

## 常见问题

### Q: Wrangler 登录失败
A: 确保浏览器没有阻止弹出窗口，或手动访问显示的 URL

### Q: 部署失败，提示权限错误
A: 确保已经正确登录，运行 `wrangler whoami` 检查

### Q: 部署成功但 API 返回错误
A: 检查 Cloudflare Workers 日志：
```bash
wrangler tail
```

### Q: 想要自定义域名
A: 编辑 `backend/wrangler.toml`，添加：
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Q: 免费额度够用吗？
A: Cloudflare Workers 免费版：
- 每天 100,000 次请求
- 对于个人使用完全够用

---

## 快速命令参考

```bash
# 部署
cd backend
wrangler deploy

# 查看日志
wrangler tail

# 查看部署列表
wrangler deployments list

# 删除部署
wrangler delete

# 查看账号信息
wrangler whoami
```

---

## 下一步

1. 部署后端到 Cloudflare Workers
2. 获取 Workers 地址
3. 更新前端 API_BASE
4. 重新构建 APK
5. 测试 APP

完成后，APP 就能正常显示音乐数据了！🎉
