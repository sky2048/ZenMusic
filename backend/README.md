# 音乐爬虫 Cloudflare Workers

## 部署步骤

### 1. 安装 Wrangler CLI
```bash
npm install
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```

### 3. 本地开发测试
```bash
npm run dev
```
访问 http://localhost:8787

### 4. 部署到 Cloudflare
```bash
npm run deploy
```

部署后会得到一个免费的 workers.dev 域名，例如：
`https://music-crawler.your-subdomain.workers.dev`

## API 接口

### 获取榜单分类
```
GET /api/rank/categories
```

### 获取榜单列表
```
GET /api/rank/{type}?page=1
```

支持的榜单类型：
- hot-music (热门榜)
- singer (歌手榜)
- surge (飙升榜)
- new (新歌榜)
- douyin (抖音榜)
- jingdian (怀旧榜)
- dianyin (电音榜)
- wwdj (DJ榜)

## 免费额度

Cloudflare Workers 免费套餐：
- 每天 100,000 次请求
- 10ms CPU 时间/请求
- 完全够个人使用

## 注意事项

1. Workers 不支持 Python，使用原生 JavaScript
2. 使用正则表达式解析 HTML（轻量级，适合 Workers）
3. 自动处理 CORS，移动端可直接调用
4. 全球 CDN 加速，响应速度快
