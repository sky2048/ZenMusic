# 🚨 Android 无数据问题 - 快速修复

## 问题
Android 应用显示"加载中..."但没有数据

## 原因
Android 需要网络权限配置

---

## ✅ 解决方案（3 步）

### 步骤 1：运行配置脚本

```bash
cd frontend

# Linux/Mac
bash configure-android.sh

# Windows
configure-android.bat
```

### 步骤 2：同步并重新构建

```bash
# 同步
npx cap sync android

# 重新构建
cd android
./gradlew assembleDebug

# 或推送到 GitHub 让 Actions 自动构建
git add .
git commit -m "Fix Android network permissions"
git push
```

### 步骤 3：重新安装 APK

下载新的 APK 并安装到设备上。

---

## 🔍 验证修复

打开应用后应该能看到：
- ✅ 热门榜数据加载
- ✅ 可以切换榜单
- ✅ 可以搜索歌曲
- ✅ 可以试听音乐

---

## 📱 如果还是不行

### 方法 1：检查网络连接
确保设备连接到互联网

### 方法 2：查看详细错误
1. 在电脑上打开 Chrome
2. 访问 `chrome://inspect`
3. 找到你的应用，点击 "inspect"
4. 查看 Console 中的错误

### 方法 3：手动配置
查看详细指南：[ANDROID-FIX.md](./ANDROID-FIX.md)

---

## 📝 技术说明

配置脚本会：
1. 创建网络安全配置文件
2. 允许访问后端 API 域名
3. 启用 HTTPS 请求

GitHub Actions 已自动包含这些配置。

---

**修复后记得重新安装 APK！** 🎉
