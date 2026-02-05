# Android 构建快速设置

## 第一次设置步骤

### 1. 安装依赖并初始化 Capacitor

```bash
cd frontend
npm install
npx cap add android
npm run build
npx cap sync android
```

### 2. 推送到 GitHub

```bash
git add .
git commit -m "Add Android build configuration"
git push
```

### 3. 测试构建

#### 方式 A：自动触发（推荐）
推送代码后，GitHub Actions 会自动构建 Debug APK。

#### 方式 B：手动触发
1. 进入 GitHub 仓库
2. 点击 Actions 标签
3. 选择 "Build Android APK (Debug)"
4. 点击 "Run workflow"

### 4. 下载 APK

1. 等待构建完成（约 5-10 分钟）
2. 在 Actions 页面点击完成的工作流
3. 在 Artifacts 部分下载 APK
4. 传输到 Android 设备安装测试

## 发布正式版本

### 1. 生成签名密钥（仅首次）

```bash
keytool -genkey -v -keystore release.keystore -alias zenmusic-key -keyalg RSA -keysize 2048 -validity 10000
```

输入信息：
- 密钥库密码：[设置一个强密码]
- 密钥密码：[设置一个强密码]
- 姓名：ZenMusic
- 组织单位：Development
- 组织：ZenMusic
- 城市：[你的城市]
- 省份：[你的省份]
- 国家代码：CN

### 2. 配置 GitHub Secrets

进入 GitHub 仓库 → Settings → Secrets and variables → Actions

添加以下 4 个 secrets：

**ANDROID_KEYSTORE_FILE**
```bash
# macOS/Linux
base64 -i release.keystore | pbcopy

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Clipboard
```
粘贴复制的内容

**KEYSTORE_KEY_ALIAS**
```
zenmusic-key
```

**KEYSTORE_KEY_PASSWORD**
```
[你设置的密钥密码]
```

**KEYSTORE_STORE_PASSWORD**
```
[你设置的密钥库密码]
```

### 3. 创建发布版本

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动：
- 构建 Release APK
- 使用密钥签名
- 创建 GitHub Release
- 上传签名的 APK

## 常用命令

```bash
# 本地开发
cd frontend
npm run dev

# 构建 Web 版本
npm run build

# 同步到 Android
npm run android:build

# 打开 Android Studio
npm run android
```

## 注意事项

1. **密钥库安全**：
   - 妥善保管 `release.keystore` 文件
   - 不要提交到 Git
   - 备份到安全位置

2. **应用 ID**：
   - 修改 `frontend/capacitor.config.ts` 中的 `appId`
   - 格式：`com.yourcompany.appname`
   - 发布后不能更改

3. **版本号**：
   - 每次发布需要增加版本号
   - 编辑 `frontend/android/app/build.gradle`

4. **测试**：
   - Debug 版本用于开发测试
   - Release 版本用于正式发布
   - 在真机上测试所有功能

## 下一步

- [ ] 完成首次构建测试
- [ ] 生成应用图标和启动画面
- [ ] 配置应用权限
- [ ] 测试所有功能
- [ ] 准备应用商店素材
- [ ] 发布到 Google Play
