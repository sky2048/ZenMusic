# Android APK 构建指南

本项目使用 GitHub Actions 自动构建 Android APK。

## 快速开始

### 方式一：自动构建（推荐）

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add Android build support"
   git push
   ```

2. **触发构建**
   - **Debug 版本**：推送到 main/master 分支会自动构建
   - **Release 版本**：创建 tag 触发
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```

3. **下载 APK**
   - 进入 GitHub 仓库的 Actions 标签页
   - 选择最新的工作流运行
   - 在 Artifacts 部分下载 APK

### 方式二：本地构建

1. **安装依赖**
   ```bash
   cd frontend
   npm install
   ```

2. **初始化 Capacitor**
   ```bash
   npx cap add android
   ```

3. **构建并同步**
   ```bash
   npm run build
   npx cap sync android
   ```

4. **打开 Android Studio**
   ```bash
   npx cap open android
   ```
   
   在 Android Studio 中：
   - Build → Build Bundle(s) / APK(s) → Build APK(s)

## 配置签名（发布版本）

如果要发布到 Google Play 或分发签名版本，需要配置密钥库。

### 1. 生成密钥库

```bash
keytool -genkey -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

记住以下信息：
- 密钥库密码 (Keystore password)
- 密钥别名 (Key alias): my-key-alias
- 密钥密码 (Key password)

### 2. 配置 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets：

1. **ANDROID_KEYSTORE_FILE**
   ```bash
   # macOS/Linux
   base64 -i release.keystore | pbcopy
   
   # Windows PowerShell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Clipboard
   ```

2. **KEYSTORE_KEY_ALIAS**
   - 值：`my-key-alias`（你设置的别名）

3. **KEYSTORE_KEY_PASSWORD**
   - 值：密钥密码

4. **KEYSTORE_STORE_PASSWORD**
   - 值：密钥库密码

### 3. 发布版本

创建并推送 tag：
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions 会自动构建并创建 Release，附带签名的 APK。

## 工作流说明

### build-android-debug.yml
- **触发条件**：推送到 main/master 分支
- **输出**：Debug APK（未签名，仅用于测试）
- **用途**：日常开发测试

### build-android.yml
- **触发条件**：推送 tag（如 v1.0.0）
- **输出**：Release APK（已签名，可发布）
- **用途**：正式发布

## 修改应用信息

### 应用 ID 和名称

编辑 `frontend/capacitor.config.ts`：
```typescript
const config: CapacitorConfig = {
  appId: 'com.zenmusic.app',  // 修改为你的应用 ID
  appName: 'ZenMusic',         // 修改为你的应用名称
  // ...
};
```

### 应用图标和启动画面

1. 准备图标（1024x1024 PNG）
2. 使用在线工具生成：https://icon.kitchen/
3. 将生成的资源放入 `frontend/android/app/src/main/res/`

## 常见问题

### Q: 构建失败，提示找不到 Android SDK
A: GitHub Actions 已配置 Java 17，无需额外配置。

### Q: 如何修改应用版本号？
A: 编辑 `frontend/android/app/build.gradle`：
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Q: APK 太大怎么办？
A: 考虑以下优化：
- 启用代码混淆
- 使用 AAB 格式（Android App Bundle）
- 优化图片资源

### Q: 如何测试 APK？
A: 
1. 下载 APK 到 Android 设备
2. 启用"未知来源"安装
3. 安装并测试

## 参考资源

- [Capacitor 官方文档](https://capacitorjs.com/)
- [Android 开发者文档](https://developer.android.com/)
- [GitHub Actions 文档](https://docs.github.com/actions)
