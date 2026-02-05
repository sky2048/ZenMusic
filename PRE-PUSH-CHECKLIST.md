# 推送前检查清单

在推送到 GitHub 触发自动构建前，请确保完成以下检查：

## ✅ 必须检查项

### 1. 文件完整性
- [ ] `frontend/package.json` 包含 Capacitor 依赖
- [ ] `frontend/capacitor.config.json` 存在且格式正确
- [ ] `frontend/vite.config.js` 配置了 build.outDir
- [ ] `.github/workflows/build-android-debug.yml` 存在
- [ ] `.github/workflows/build-android.yml` 存在

### 2. 依赖安装
```bash
cd frontend
npm install
```
- [ ] 安装成功，无错误

### 3. 前端构建
```bash
npm run build
```
- [ ] 构建成功
- [ ] `frontend/dist` 目录存在
- [ ] `frontend/dist/index.html` 存在

### 4. Capacitor 配置
检查 `frontend/capacitor.config.json`：
```json
{
  "appId": "com.zenmusic.app",
  "appName": "ZenMusic",
  "webDir": "dist"
}
```
- [ ] appId 格式正确（com.xxx.xxx）
- [ ] webDir 指向 "dist"

### 5. Git 提交
- [ ] `package-lock.json` 已提交
- [ ] `.gitignore` 正确配置（不包含 node_modules）
- [ ] 所有更改已提交

## 🔧 可选检查项

### 6. 本地测试（推荐）
```bash
# Linux/Mac
bash test-build.sh

# Windows
test-build.bat
```
- [ ] 测试脚本运行成功
- [ ] Android 平台添加成功
- [ ] Capacitor 同步成功

### 7. 应用信息
- [ ] 修改了 appId 为你自己的（如果需要）
- [ ] 修改了 appName（如果需要）
- [ ] 准备了应用图标（如果需要）

## 🚀 首次构建步骤

### 步骤 1：推送代码
```bash
git add .
git commit -m "Add Android build configuration"
git push origin main
```

### 步骤 2：查看构建
1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看 "Build Android APK (Debug)" 工作流
4. 等待构建完成（约 5-10 分钟）

### 步骤 3：下载 APK
1. 点击完成的工作流
2. 在 "Artifacts" 部分找到 APK
3. 下载到本地
4. 传输到 Android 设备测试

## 🔐 发布版本（可选）

如果要构建签名的 Release 版本：

### 1. 生成密钥库
```bash
keytool -genkey -v -keystore release.keystore -alias zenmusic-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. 配置 GitHub Secrets
在 GitHub 仓库设置中添加：
- [ ] ANDROID_KEYSTORE_FILE（base64 编码）
- [ ] KEYSTORE_KEY_ALIAS
- [ ] KEYSTORE_KEY_PASSWORD
- [ ] KEYSTORE_STORE_PASSWORD

### 3. 创建 Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

## ❌ 常见错误预防

### 错误 1：gradlew 权限
- ✅ 已在工作流中添加 `chmod +x gradlew`

### 错误 2：npm ci 失败
- ✅ 已改为 `npm ci || npm install`

### 错误 3：Android 平台不存在
- ✅ 已添加 `npx cap add android || echo "exists"`

### 错误 4：dist 目录为空
- ⚠️ 确保 `npm run build` 成功

### 错误 5：Capacitor 配置错误
- ⚠️ 使用 JSON 格式，不是 TypeScript

## 📝 快速命令参考

```bash
# 完整测试流程
cd frontend
npm install
npm run build
npx cap add android
npx cap sync android

# 查看 Capacitor 状态
npx cap ls

# 清理重建
rm -rf android node_modules
npm install
npx cap add android

# 本地构建（需要 Android Studio）
npx cap open android
```

## 🆘 遇到问题？

1. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. 运行 `test-build.sh` 诊断问题
3. 查看 GitHub Actions 日志
4. 检查是否遗漏了某个步骤

---

**准备好了？开始推送吧！** 🚀

```bash
git push origin main
```
