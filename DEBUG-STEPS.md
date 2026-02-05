# Android 网络问题调试步骤

## 当前状态

应用显示"加载中..."但无法加载数据。

## 已添加的调试功能

最新版本的 APK 会在界面上显示错误信息（Toast 提示），包括：
- 请求的 URL
- HTTP 状态码
- 具体的错误消息

## 下一步调试

### 1. 安装最新的 APK

等待 GitHub Actions 构建完成，下载并安装最新的 APK。

### 2. 查看错误提示

打开应用后，如果加载失败，会在屏幕底部显示错误提示，例如：
- "加载失败: HTTP 403: Forbidden"
- "加载失败: Network request failed"
- "加载失败: TypeError: Failed to fetch"

### 3. 根据错误信息判断问题

#### 错误 A: "Failed to fetch" 或 "Network request failed"
**原因：** 网络请求被阻止

**解决方案：**
1. 检查手机是否联网
2. 检查应用是否有网络权限
3. 可能需要使用 Capacitor Http 插件

#### 错误 B: "HTTP 403" 或 "HTTP 401"
**原因：** 服务器拒绝请求（可能是 CORS 或认证问题）

**解决方案：**
1. 后端需要允许来自 `capacitor://localhost` 的请求
2. 检查后端 CORS 配置

#### 错误 C: "HTTP 404"
**原因：** API 端点不存在

**解决方案：**
1. 检查 API_BASE 地址是否正确
2. 检查后端是否正常运行

#### 错误 D: "数据格式错误"
**原因：** 后端返回的数据格式不符合预期

**解决方案：**
1. 检查后端返回的 JSON 格式
2. 查看后端日志

## 临时测试方案

如果一直无法解决，可以尝试：

### 方案 1：使用测试数据

在 `Home.vue` 中添加测试数据：

```javascript
const fetchRankData = async (categoryId, page = 1, append = false) => {
  // 临时：使用测试数据
  loading.value = true
  
  setTimeout(() => {
    rankSongs.value = [
      { id: '1', name: '测试歌曲1', artist: '测试歌手1', rank: 1 },
      { id: '2', name: '测试歌曲2', artist: '测试歌手2', rank: 2 },
      { id: '3', name: '测试歌曲3', artist: '测试歌手3', rank: 3 },
    ]
    loading.value = false
    showToast('使用测试数据')
  }, 1000)
}
```

### 方案 2：使用 Capacitor Http 插件

如果 fetch 确实不工作，改用 Capacitor 的原生 Http：

```javascript
import { CapacitorHttp } from '@capacitor/core'

const fetchRankData = async (categoryId, page = 1, append = false) => {
  try {
    const options = {
      url: `${API_BASE}/api/rank/${category.apiId}?page=${page}`,
      headers: { 'Content-Type': 'application/json' }
    }
    
    const response = await CapacitorHttp.get(options)
    const result = response.data
    
    // 处理数据...
  } catch (error) {
    showToast(`加载失败: ${error.message}`)
  }
}
```

### 方案 3：检查 WebView 控制台

使用 Chrome 远程调试查看 Android WebView 的控制台：

1. 在 Android 设备上启用 USB 调试
2. 连接到电脑
3. 在 Chrome 中访问 `chrome://inspect`
4. 找到你的应用并点击 "inspect"
5. 查看 Console 标签中的错误信息

## 可能的根本原因

根据之前的研究，最可能的原因是：

1. **WebView 的网络限制** - Android WebView 对 fetch 有严格限制
2. **CORS 问题** - 来自 `capacitor://localhost` 的请求被服务器拒绝
3. **证书问题** - HTTPS 证书不被 Android 信任
4. **网络安全策略** - Android 9+ 的网络安全配置

## 下次更新计划

如果错误提示显示是 "Failed to fetch"，我会：

1. 改用 Capacitor Http 插件的原生方法
2. 或者添加一个代理层
3. 或者修改后端以支持更宽松的 CORS

---

**等待你的反馈：** 安装最新 APK 后，告诉我看到了什么错误提示！
