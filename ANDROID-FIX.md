# Android 网络问题修复指南

## 问题：Android 应用显示"加载中..."但没有数据

### 原因
Android 应用需要特殊配置才能访问网络 API：
1. 需要网络权限
2. 需要配置网络安全策略
3. 需要允许 HTTPS 请求

---

## 🚀 快速修复（推荐）

### 方法一：自动配置脚本

```bash
cd frontend

# Linux/Mac
bash configure-android.sh

# Windows
configure-android.bat

# 然后同步
npx cap sync android
```

### 方法二：手动配置

#### 1. 添加网络权限

编辑 `frontend/android/app/src/main/AndroidManifest.xml`

在 `<manifest>` 标签内添加（在 `<application>` 之前）：

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

#### 2. 配置网络安全策略

在 `<application>` 标签添加属性：

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ...其他属性>
```

#### 3. 创建网络安全配置文件

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
        <domain includeSubdomains="true">www.gequhai.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

#### 4. 同步并重新构建

```bash
cd frontend
npx cap sync android
npx cap open android
```

在 Android Studio 中重新构建 APK。

---

## 📋 完整的 AndroidManifest.xml 示例

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- 网络权限 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

</manifest>
```

---

## 🔍 验证配置

### 1. 检查权限

```bash
cd frontend/android
grep -r "INTERNET" app/src/main/AndroidManifest.xml
```

应该看到：
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 2. 检查网络安全配置

```bash
ls -la app/src/main/res/xml/network_security_config.xml
```

文件应该存在。

### 3. 检查 Capacitor 配置

查看 `frontend/capacitor.config.json`：

```json
{
  "appId": "com.zenmusic.app",
  "appName": "ZenMusic",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "allowNavigation": [
      "https://music-crawler.sky70old.workers.dev",
      "https://*.workers.dev",
      "https://www.gequhai.com"
    ]
  },
  "android": {
    "allowMixedContent": true
  }
}
```

---

## 🐛 调试步骤

### 1. 使用 Chrome 远程调试

1. 在 Android 设备上打开应用
2. 在电脑上打开 Chrome 浏览器
3. 访问 `chrome://inspect`
4. 找到你的应用，点击 "inspect"
5. 查看 Console 中的错误信息

### 2. 查看 Logcat

在 Android Studio 中：
1. 打开 Logcat 窗口
2. 过滤 "Capacitor" 或 "WebView"
3. 查看网络请求错误

### 3. 测试网络连接

在应用中添加测试代码（临时）：

```javascript
// 在 Home.vue 的 onMounted 中添加
console.log('测试网络连接...')
fetch('https://music-crawler.sky70old.workers.dev/api/rank/categories')
  .then(res => res.json())
  .then(data => console.log('网络正常:', data))
  .catch(err => console.error('网络错误:', err))
```

---

## ⚠️ 常见错误

### 错误 1: net::ERR_CLEARTEXT_NOT_PERMITTED

**原因：** Android 9+ 默认不允许明文 HTTP 流量

**解决：** 
- 确保添加了 `android:usesCleartextTraffic="true"`
- 确保配置了 `network_security_config.xml`

### 错误 2: net::ERR_CONNECTION_REFUSED

**原因：** 无法连接到服务器

**解决：**
- 检查设备网络连接
- 确认后端 API 地址正确
- 测试在浏览器中能否访问 API

### 错误 3: CORS 错误

**原因：** 跨域请求被阻止

**解决：**
- Capacitor 应用不受 CORS 限制
- 如果看到 CORS 错误，可能是其他配置问题

### 错误 4: 权限被拒绝

**原因：** 没有网络权限

**解决：**
- 确保 AndroidManifest.xml 中有 INTERNET 权限
- 重新安装应用

---

## 📱 重新构建步骤

修改配置后，必须重新构建：

```bash
cd frontend

# 1. 清理旧的构建
rm -rf android

# 2. 重新添加 Android 平台
npx cap add android

# 3. 运行配置脚本
bash configure-android.sh  # 或 configure-android.bat

# 4. 同步
npx cap sync android

# 5. 构建
cd android
./gradlew assembleDebug

# 或在 Android Studio 中构建
```

---

## ✅ 验证修复

修复后，应用应该能够：

1. ✅ 显示热门榜数据
2. ✅ 切换不同榜单
3. ✅ 搜索歌曲
4. ✅ 试听音乐
5. ✅ 添加到播放列表

---

## 🔄 GitHub Actions 自动配置

如果使用 GitHub Actions 构建，需要在工作流中添加配置步骤：

```yaml
- name: Configure Android Network
  working-directory: frontend
  run: |
    bash configure-android.sh
    npx cap sync android
```

---

## 📚 相关文档

- [Android 网络安全配置](https://developer.android.com/training/articles/security-config)
- [Capacitor Android 配置](https://capacitorjs.com/docs/android/configuration)
- [Android 权限](https://developer.android.com/guide/topics/permissions/overview)

---

## 🆘 还是不行？

1. 检查后端 API 是否正常：
   ```bash
   curl https://music-crawler.sky70old.workers.dev/api/rank/categories
   ```

2. 确认设备网络连接正常

3. 查看 Chrome 远程调试的 Console 错误

4. 检查 Android Studio 的 Logcat 日志

5. 尝试在浏览器中打开应用测试（`npm run dev`）

---

**修复后记得重新构建并安装 APK！** 🎉
