# Android 网络问题修复

## 问题描述

Android APK 安装后显示"加载中..."，但无法加载音乐数据。

## 根本原因

经过搜索和分析，发现问题是：

1. **Capacitor Android 应用的 origin 是 `capacitor://localhost`**，而不是普通的 `http://` 或 `https://`
2. **原生 fetch API 在 Android WebView 中可能受到限制**
3. **CORS 和网络安全策略问题**

## 解决方案

### 1. 启用 CapacitorHttp 插件

在 `frontend/capacitor.config.json` 中添加：

```json
{
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
}
```

**作用：** 
- 自动将 `fetch` 和 `XMLHttpRequest` 替换为原生网络库
- 绕过 WebView 的限制
- 解决 CORS 问题

### 2. 添加网络安全配置

创建 `frontend/android/app/src/main/res/xml/network_security_config.xml`：

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

更新 `AndroidManifest.xml`：

```xml
<application
    ...
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
```

**作用：**
- 允许 HTTP 和 HTTPS 混合内容
- 信任系统和用户证书
- 解决 Android 9+ 的网络安全限制

## 技术细节

### Capacitor Http 插件

- **内置于 @capacitor/core**，无需额外安装
- 默认禁用，需要手动启用
- 启用后会自动 patch `fetch` 和 `XMLHttpRequest`
- 使用原生网络库（Android 的 OkHttp）

### 为什么需要这个？

根据 [Capacitor 文档](https://capacitorjs.com/docs/apis/http) 和社区讨论：

1. **WebView 限制**：Android WebView 对网络请求有严格限制
2. **CORS 问题**：来自 `capacitor://localhost` 的请求可能被服务器拒绝
3. **性能优化**：原生网络库比 WebView 的 fetch 更高效

### 参考资料

- [Capacitor Http API 文档](https://capacitorjs.com/docs/apis/http)
- [Stack Overflow: Capacitor Android fails to fetch from api](https://stackoverflow.com/questions/67576100/capacitor-android-fails-to-fetch-from-api)
- [Ionic Forum: Fetch not working on Android](https://forum.ionicframework.com/t/fetch-not-working-on-android/208108)
- [How to make API calls in Ionic Capacitor Apps](https://enappd.com/blog/how-to-make-api-calls-in-ionic-capacitor-apps/179/)

## 测试步骤

1. **等待 GitHub Actions 构建完成**（约 5-10 分钟）
2. **下载新的 APK**
3. **安装到 Android 设备**
4. **打开应用**
5. **验证数据加载**

## 预期结果

- ✅ 应用启动后自动加载热门榜数据
- ✅ 可以切换不同榜单
- ✅ 搜索功能正常
- ✅ 可以试听和添加歌曲

## 如果还是不行

### 检查清单

1. **后端是否正常**
   ```bash
   curl https://music-crawler.sky70old.workers.dev/api/rank/hot-music
   ```
   应该返回 JSON 数据

2. **查看 Android 日志**
   ```bash
   adb logcat | grep -i capacitor
   ```

3. **检查网络权限**
   确认 `AndroidManifest.xml` 包含：
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

4. **清除应用数据**
   - 设置 → 应用 → ZenMusic → 存储 → 清除数据
   - 重新打开应用

## 其他可能的解决方案

如果上述方案不行，可以尝试：

### 方案 A：使用 Capacitor Community Http 插件

```bash
npm install @capacitor-community/http
```

### 方案 B：修改后端 CORS 配置

在后端添加更宽松的 CORS 头：

```javascript
'Access-Control-Allow-Origin': '*',
'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
'Access-Control-Allow-Headers': '*'
```

### 方案 C：使用代理

在 Capacitor 配置中添加代理：

```json
{
  "server": {
    "url": "http://your-proxy-server.com",
    "cleartext": true
  }
}
```

## 总结

通过启用 CapacitorHttp 插件和配置网络安全策略，应该能解决 Android 应用无法加载数据的问题。这是 Capacitor 应用的标准做法，用于绕过 WebView 的网络限制。

---

**更新时间：** 2026-02-06  
**状态：** 已推送到 GitHub，等待构建
