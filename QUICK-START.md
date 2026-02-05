# 🚀 快速开始 - 3 步构建 Android APK

## 第一步：准备代码（2 分钟）

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 测试构建（可选但推荐）
```bash
# Linux/Mac
bash test-build.sh

# Windows
test-build.bat
```

如果测试脚本全部通过 ✅，继续下一步。

## 第二步：推送到 GitHub（1 分钟）

```bash
git add .
git commit -m "Add Android build support"
git push origin main
```

## 第三步：下载 APK（5-10 分钟）

1. 打开你的 GitHub 仓库
2. 点击顶部的 **Actions** 标签
3. 看到 "Build Android APK (Debug)" 工作流正在运行
4. 等待绿色勾号 ✅（约 5-10 分钟）
5. 点击工作流，在 **Artifacts** 部分下载 APK
6. 传输到 Android 设备安装测试

## 🎉 完成！

你的 APK 已经构建好了！

---

## 📱 安装到手机

### Android 设备
1. 下载 APK 到手机
2. 打开文件管理器
3. 点击 APK 文件
4. 允许"未知来源"安装
5. 点击安装

### 通过 ADB（开发者）
```bash
adb install zenmusic-debug.apk
```

---

## 🔄 后续更新

每次修改代码后：
```bash
git add .
git commit -m "Update: 你的修改说明"
git push
```

GitHub Actions 会自动构建新的 APK。

---

## 🎯 发布正式版本

当你准备发布时：

### 1. 生成签名密钥（仅首次）
```bash
keytool -genkey -v -keystore release.keystore -alias zenmusic-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置 GitHub Secrets
进入 GitHub 仓库 → Settings → Secrets and variables → Actions

添加 4 个 secrets：
- `ANDROID_KEYSTORE_FILE`（密钥库 base64）
- `KEYSTORE_KEY_ALIAS`（zenmusic-key）
- `KEYSTORE_KEY_PASSWORD`（密钥密码）
- `KEYSTORE_STORE_PASSWORD`（密钥库密码）

详细步骤见 [ANDROID_BUILD.md](./ANDROID_BUILD.md#配置签名发布版本)

### 3. 创建发布
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub 会自动构建签名的 APK 并创建 Release。

---

## ❓ 遇到问题？

### 构建失败
1. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. 检查 GitHub Actions 日志
3. 确认 [PRE-PUSH-CHECKLIST.md](./PRE-PUSH-CHECKLIST.md) 都完成了

### 常见问题
- **gradlew 权限错误** → 已自动修复
- **npm ci 失败** → 已自动回退到 npm install
- **Android 平台不存在** → 会自动添加
- **dist 目录为空** → 检查 `npm run build` 是否成功

---

## 📚 更多文档

- [完整构建指南](./ANDROID_BUILD.md)
- [问题排查](./TROUBLESHOOTING.md)
- [推送前检查](./PRE-PUSH-CHECKLIST.md)
- [修复说明](./BUILD-FIXES.md)

---

**就这么简单！开始构建你的 Android 应用吧！** 🎊
