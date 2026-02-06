# 📱 Android Studio 本地构建指南

## ✅ 已完成的准备工作

1. ✅ 安装了依赖
2. ✅ 构建了前端 (dist 目录)
3. ✅ 添加了 Android 平台
4. ✅ 修复了网络权限配置
5. ✅ 同步了 Capacitor
6. ✅ 打开了 Android Studio

---

## 🔧 在 Android Studio 中构建

### 步骤 1：等待 Gradle 同步

Android Studio 打开后会自动同步 Gradle：
- 底部会显示 "Gradle sync in progress..."
- 等待完成（首次可能需要几分钟下载依赖）

### 步骤 2：选择构建变体

1. 点击菜单 **Build → Select Build Variant**
2. 在右侧面板选择 **debug** 或 **release**
   - **debug**: 用于测试，无需签名
   - **release**: 用于发布，需要签名

### 步骤 3：构建 APK

#### 方式 A：构建 Debug APK（推荐）

1. 点击菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. 等待构建完成
3. 点击通知中的 **locate** 查看 APK 位置

**APK 位置：**
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

#### 方式 B：直接运行到设备

1. 连接 Android 设备（USB 调试模式）
2. 在顶部工具栏选择你的设备
3. 点击绿色的 **Run** 按钮 ▶️
4. 应用会自动安装并启动

### 步骤 4：查看日志

如果应用运行但没有数据：

1. 点击底部的 **Logcat** 标签
2. 在过滤器中输入：`Capacitor` 或 `WebView`
3. 查看网络请求相关的日志

---

## 🐛 使用 Chrome DevTools 调试

### 启用 WebView 调试

已在 `capacitor.config.json` 中启用：
```json
"webContentsDebuggingEnabled": true
```

### 连接 Chrome DevTools

1. 在设备上运行应用
2. 在电脑上打开 Chrome
3. 访问 `chrome://inspect`
4. 找到 "ZenMusic" 应用
5. 点击 **inspect**

### 查看日志

在 Console 标签中，你应该看到：

```
=== Home 组件已挂载 ===
API_BASE: https://music-crawler.sky70old.workers.dev
测试基础网络...
✅ httpbin 测试成功
✅ categories 测试成功
=== 开始请求 ===
```

如果看到 ❌ 错误，记录错误信息。

---

## 📋 验证配置

### 检查 AndroidManifest.xml

文件位置：`frontend/android/app/src/main/AndroidManifest.xml`

应该包含：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true"
        ...>
```

### 检查网络安全配置

文件位置：`frontend/android/app/src/main/res/xml/network_security_config.xml`

应该存在并包含：

```xml
<domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">music-crawler.sky70old.workers.dev</domain>
    <domain includeSubdomains="true">workers.dev</domain>
    ...
</domain-config>
```

---

## 🔄 如果需要重新构建

### 清理项目

在 Android Studio 中：
1. **Build → Clean Project**
2. **Build → Rebuild Project**

### 或使用命令行

```bash
cd frontend/android
./gradlew clean
./gradlew assembleDebug
```

Windows:
```cmd
cd frontend\android
gradlew.bat clean
gradlew.bat assembleDebug
```

---

## 📱 安装 APK 到设备

### 方式 1：通过 Android Studio

直接点击 Run 按钮 ▶️

### 方式 2：通过 ADB

```bash
adb install -r frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

### 方式 3：手动安装

1. 将 APK 文件传输到设备
2. 在设备上打开文件管理器
3. 点击 APK 文件
4. 允许"未知来源"安装
5. 点击安装

---

## 🎯 测试清单

安装后测试：

- [ ] 应用可以启动
- [ ] 显示"禅音"标题
- [ ] 显示榜单分类（热门榜、飙升榜等）
- [ ] 点击榜单可以加载歌曲列表
- [ ] 可以搜索歌曲
- [ ] 可以试听音乐
- [ ] 可以添加到播放列表

---

## ❌ 常见问题

### 问题 1：Gradle 同步失败

**解决：**
- 检查网络连接
- 在 Android Studio 中：File → Invalidate Caches → Invalidate and Restart

### 问题 2：构建失败

**解决：**
```bash
cd frontend
rm -rf android
npx cap add android
npm run android:fix
npx cap sync android
```

### 问题 3：应用安装失败

**解决：**
- 卸载旧版本
- 检查设备存储空间
- 启用"未知来源"安装

### 问题 4：应用崩溃

**解决：**
- 查看 Logcat 日志
- 检查是否有 JavaScript 错误
- 使用 Chrome DevTools 调试

---

## 🔍 调试技巧

### 查看网络请求

在 Chrome DevTools 的 Network 标签：
1. 刷新应用
2. 查看是否有请求发出
3. 检查请求状态码
4. 查看响应内容

### 测试 API

在 Chrome DevTools Console 中：

```javascript
// 测试基础网络
fetch('https://httpbin.org/get')
  .then(r => r.json())
  .then(d => console.log('✅ 网络正常:', d))
  .catch(e => console.error('❌ 网络失败:', e))

// 测试 API
fetch('https://music-crawler.sky70old.workers.dev/api/rank/categories')
  .then(r => r.json())
  .then(d => console.log('✅ API 正常:', d))
  .catch(e => console.error('❌ API 失败:', e))
```

---

## 📞 需要帮助？

如果构建或运行遇到问题，提供：

1. **Android Studio 的错误信息**
   - Build 输出窗口的错误
   - Logcat 的相关日志

2. **Chrome DevTools 的日志**
   - Console 标签的错误信息
   - Network 标签的请求状态

3. **设备信息**
   - Android 版本
   - 设备型号

---

**祝构建顺利！** 🚀

如果应用能启动但没有数据，使用 Chrome DevTools 查看具体的网络错误信息。
