# Android 调试完全指南

## 🔍 问题诊断

### 步骤 1：确认 API 可访问

在浏览器或命令行测试：

```bash
# 测试 API
curl https://music-crawler.sky70old.workers.dev/api/rank/categories

# 应该返回 JSON 数据
```

如果能返回数据，说明 API 正常。

### 步骤 2：检查 Android 应用网络请求

使用 Chrome 远程调试：

1. 在 Android 设备上打开应用
2. 在电脑上打开 Chrome 浏览器
3. 访问 `chrome://inspect`
4. 找到你的应用，点击 "inspect"
5. 查看 Console 和 Network 标签

**查找以下错误：**
- `net::ERR_CLEARTEXT_NOT_PERMITTED` - 网络安全配置问题
- `net::ERR_CONNECTION_REFUSED` - 无法连接
- `CORS error` - 跨域问题（Capacitor 不应该有）
- `Failed to fetch` - 网络请求失败

---

## 🛠️ 完整修复流程

### 方法 1：使用自动修复脚本（推荐）

```bash
cd frontend

# 1. 确保有 android 目录
npx cap add android

# 2. 运行自动修复脚本
npm run android:fix

# 3. 同步
npx cap sync android

# 4. 构建
cd android
./gradlew assembleDebug --stacktrace

# 5. 安装 APK
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 方法 2：手动配置

#### 2.1 编辑 AndroidManifest.xml

文件位置：`frontend/android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 添加这两行 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        <!-- 添加这两行 -->
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true">

        <!-- 其他内容保持不变 -->
        
    </application>
</manifest>
```

#### 2.2 创建网络安全配置

创建文件：`frontend/android/app/src/main/res/xml/network_security_config.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">music-crawler.sky70old.workers.dev</domain>
        <domain includeSubdomains="true">workers.dev</domain>
        <domain includeSubdomains="true">www.gequhai.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

#### 2.3 更新 Capacitor 配置

编辑 `frontend/capacitor.config.json`：

```json
{
  "appId": "com.zenmusic.app",
  "appName": "ZenMusic",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "allowNavigation": ["*"],
    "cleartext": true
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}
```

---

## 🧪 测试步骤

### 1. 清理并重建

```bash
cd frontend

# 删除旧的 Android 项目
rm -rf android

# 重新添加
npx cap add android

# 运行修复脚本
npm run android:fix

# 同步
npx cap sync android

# 构建
cd android
./gradlew clean
./gradlew assembleDebug --info --stacktrace
```

### 2. 查看构建日志

检查是否有错误：
- 权限配置错误
- 资源文件缺失
- Gradle 构建失败

### 3. 安装并测试

```bash
# 安装到设备
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 查看日志
adb logcat | grep -i "capacitor\|webview\|network"
```

---

## 🔬 深度调试

### 启用 WebView 调试

在 `capacitor.config.json` 中已启用：
```json
"webContentsDebuggingEnabled": true
```

### 查看网络请求

在 Chrome DevTools 的 Network 标签中：
1. 刷新应用
2. 查看是否有请求发出
3. 检查请求状态码
4. 查看响应内容

### 常见问题排查

#### 问题 1：请求根本没发出

**可能原因：**
- JavaScript 错误阻止了代码执行
- API_BASE 配置错误

**解决：**
```javascript
// 在 Home.vue 的 onMounted 中添加
console.log('API_BASE:', API_BASE)
console.log('开始请求数据...')
```

#### 问题 2：请求发出但失败

**可能原因：**
- 网络权限未配置
- 网络安全策略阻止

**解决：**
- 确认 AndroidManifest.xml 配置正确
- 确认 network_security_config.xml 存在

#### 问题 3：请求成功但数据不显示

**可能原因：**
- 数据解析错误
- Vue 响应式问题

**解决：**
```javascript
// 添加详细日志
console.log('响应数据:', result)
console.log('歌曲列表:', result.data.songs)
```

---

## 📱 使用 ADB 调试

### 安装 ADB

- **Windows**: 下载 [Platform Tools](https://developer.android.com/studio/releases/platform-tools)
- **Mac**: `brew install android-platform-tools`
- **Linux**: `sudo apt install adb`

### 常用命令

```bash
# 查看连接的设备
adb devices

# 安装 APK
adb install -r path/to/app.apk

# 卸载应用
adb uninstall com.zenmusic.app

# 查看日志
adb logcat

# 过滤日志
adb logcat | grep "Capacitor"

# 清除应用数据
adb shell pm clear com.zenmusic.app

# 启动应用
adb shell am start -n com.zenmusic.app/.MainActivity
```

---

## 🎯 验证清单

修复后，逐项检查：

### 文件检查
- [ ] `AndroidManifest.xml` 包含 INTERNET 权限
- [ ] `AndroidManifest.xml` 包含 networkSecurityConfig 属性
- [ ] `network_security_config.xml` 文件存在
- [ ] `capacitor.config.json` 配置正确

### 功能检查
- [ ] 应用可以安装
- [ ] 应用可以启动
- [ ] Chrome DevTools 可以连接
- [ ] Console 没有网络错误
- [ ] Network 标签显示请求
- [ ] 数据可以加载显示

---

## 🆘 还是不行？

### 最后的排查步骤

1. **确认设备网络**
   ```bash
   # 在设备上测试网络
   adb shell ping -c 3 8.8.8.8
   ```

2. **测试简单请求**
   在 Home.vue 的 onMounted 中添加：
   ```javascript
   fetch('https://httpbin.org/get')
     .then(r => r.json())
     .then(d => console.log('测试请求成功:', d))
     .catch(e => console.error('测试请求失败:', e))
   ```

3. **检查 Capacitor 版本**
   ```bash
   npx cap doctor
   ```

4. **完全重置**
   ```bash
   cd frontend
   rm -rf android node_modules package-lock.json
   npm install
   npx cap add android
   npm run android:fix
   npx cap sync android
   ```

---

## 📞 获取帮助

如果以上都不行，提供以下信息：

1. Chrome DevTools Console 的完整错误信息
2. `adb logcat` 的相关日志
3. `AndroidManifest.xml` 的内容
4. `capacitor.config.json` 的内容
5. Android 版本和设备型号

---

**记住：每次修改配置后都要重新构建和安装 APK！** 🔄
