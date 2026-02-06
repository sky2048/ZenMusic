# ZenMusic 后端

基于 Cloudflare Workers 的音乐榜单爬虫 API

## 技术栈

- Cloudflare Workers - 边缘计算平台
- JavaScript - 原生 JS，无需框架
- Wrangler - Cloudflare Workers CLI 工具

## 开发环境要求

- Node.js 16+
- npm 或 yarn
- Cloudflare 账号（免费）

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 登录 Cloudflare
```bash
npx wrangler login
```
会打开浏览器进行授权登录

### 3. 本地开发
```bash
npm run dev
```
访问 http://localhost:8787

### 4. 部署到生产环境
```bash
npm run deploy
```

部署成功后会得到一个 workers.dev 域名，例如：
```
https://music-crawler.your-subdomain.workers.dev
```

## API 接口文档

### 基础 URL
```
https://your-worker.workers.dev
```

### 1. 获取榜单分类
```http
GET /api/rank/categories
```

**响应示例：**
```json
{
  "code": 200,
  "data": [
    { "id": "hot-music", "name": "热门榜" },
    { "id": "singer", "name": "歌手榜" },
    { "id": "surge", "name": "飙升榜" },
    { "id": "new", "name": "新歌榜" },
    { "id": "douyin", "name": "抖音榜" },
    { "id": "jingdian", "name": "怀旧榜" },
    { "id": "dianyin", "name": "电音榜" },
    { "id": "wwdj", "name": "DJ榜" }
  ]
}
```

### 2. 获取榜单列表
```http
GET /api/rank/{type}?page=1
```

**路径参数：**
- `type`: 榜单类型（见上方分类列表）

**查询参数：**
- `page`: 页码，默认 1

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "rank": 1,
        "title": "歌曲名称",
        "artist": "歌手名称",
        "album": "专辑名称",
        "duration": "03:45",
        "playUrl": "https://..."
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

## 项目结构

```
backend/
├── routes/
│   └── rank.js         # 榜单路由处理
├── crawler/            # 爬虫逻辑（如有）
├── worker.js           # Workers 入口文件
├── wrangler.toml       # Cloudflare 配置
└── package.json
```

## 配置说明

### wrangler.toml
```toml
name = "music-crawler"
main = "worker.js"
compatibility_date = "2024-01-01"

[vars]
# 环境变量配置
```

## Cloudflare Workers 特性

### 免费额度
- 每天 100,000 次请求
- 10ms CPU 时间/请求
- 完全够个人使用

### 优势
- 全球 CDN 边缘节点部署
- 自动 HTTPS
- 零配置 CORS 支持
- 毫秒级响应速度
- 无需服务器维护

### 限制
- 单次请求 CPU 时间限制 10ms（免费版）
- 不支持长连接
- 不支持文件系统
- 内存限制 128MB

## 开发注意事项

1. **轻量级解析**：使用正则表达式解析 HTML，避免引入大型库
2. **CORS 处理**：已自动配置跨域响应头
3. **错误处理**：统一的错误响应格式
4. **缓存策略**：可配置 Cloudflare CDN 缓存

## 调试技巧

### 查看日志
```bash
# 实时查看 Workers 日志
npx wrangler tail
```

### 本地测试
```bash
# 使用 curl 测试
curl http://localhost:8787/api/rank/categories

# 使用 Postman 或浏览器测试
```

## 部署流程

1. **开发阶段**：使用 `npm run dev` 本地测试
2. **测试阶段**：部署到测试环境验证
3. **生产部署**：运行 `npm run deploy`
4. **监控**：通过 Cloudflare Dashboard 查看请求统计

## 自定义域名（可选）

1. 在 Cloudflare Dashboard 添加域名
2. 在 Workers 设置中绑定自定义域名
3. 更新 `wrangler.toml` 配置

## 常见问题

### 1. 部署失败
- 检查是否已登录：`npx wrangler whoami`
- 确认 wrangler.toml 配置正确
- 查看错误日志排查问题

### 2. 请求超时
- 检查爬虫目标网站是否可访问
- 优化代码减少 CPU 时间
- 考虑添加缓存

### 3. CORS 错误
- 确认响应头包含正确的 CORS 配置
- 检查前端请求方式

## 版本信息

当前版本：1.0.0

## 许可证

MIT
