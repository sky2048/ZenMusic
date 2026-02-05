# Android 构建问题排查指南

## 常见构建失败原因及解决方案

### 1. gradlew 权限错误

**错误信息：**
```
Permission denied: ./gradlew
```

**原因：** gradlew 文件没有执行权限

**解决方案：**
- 已在 GitHub Actions 中添加 `chmod +x gradlew` 步骤
- 本地构建时运行：`chmod +x frontend/android/gradlew`

---

### 2. npm ci 失败

**错误信息：**
```
npm ERR! The `npm ci` command can only install with an existing package-lock.json
```

**原因：** package-lock.json 不存在或版本不匹配

**解决方案：**
- 工作流已改为 `npm ci || npm install`（自动回退）
- 本地运行 `npm install` 生成 package-lock.json
- 确保 package-lock.json 已提交到 Git

---

### 3. Android 平台不存在

**错误信息：**
```
Error: android directory does not exist
```

**原因：** Capacitor Android 平台未初始化

**解决方案：**
- 工作流会自动运行 `npx cap add android`
- 本地运行：
  ```bash
  cd frontend
  npx cap add android
  npx cap sync android
  ```

---

### 4. dist 目录为空或不存在

**错误信息：**
```
Error: webDir does not exist
```

**原因：** 前端构建失败或未构建

**解决方案：**
1. 检查 `npm run build` 是否成功
2. 确认 `frontend/dist` 目录存在且包含 index.html
3. 检查 vite.config.js 中的 `outDir` 配置

---

### 5. Gradle 构建失败

**错误信息：**
```
FAILURE: Build failed with an exception
```

**可能原因及解决方案：**

#### 5.1 Java 版本不匹配
- GitHub Actions 使用 Java 17
- 本地确保安装 Java 17：
  ```bash
  java -version
  ```

#### 5.2 Gradle 缓存问题
- 清理 Gradle 缓存：
  ```bash
  cd frontend/android
  ./gradlew clean
  ```

#### 5.3 依赖下载失败
- 检查网络连接
- 工作流添加了 `--stacktrace` 查看详细错误

---

### 6. APK 签名失败

**错误信息：**
```
apksigner: command not found
```

**原因：** Android SDK build-tools 路径问题

**解决方案：**
- GitHub Actions 已配置 `$ANDROID_HOME`
- 确保 Secrets 配置正确：
  - ANDROID_KEYSTORE_FILE（base64 编码）
  - KEYSTORE_KEY_ALIAS
  - KEYSTORE_KEY_PASSWORD
  - KEYSTORE_STORE_PASSWORD

---

### 7. Capacitor 配置错误

**错误信息：**
```
Error loading capacitor.config
```

**原因：** 配置文件格式错误

**解决方案：**
- 使用 `capacitor.config.json` 而非 `.ts`
- 验证 JSON 格式：
  ```json
  {
    "appId": "com.zenmusic.app",
    "appName": "ZenMusic",
    "webDir": "dist"
  }
  ```

---

### 8. Node 模块缺失

**错误信息：**
```
Cannot find module '@capacitor/cli'
```

**原因：** Capacitor 依赖未安装

**解决方案：**
- 确保 package.json 包含：
  ```json
  {
    "dependencies": {
      "@capacitor/core": "^6.0.0",
      "@capacitor/android": "^6.0.0"
    },
    "devDependencies": {
      "@capacitor/cli": "^6.0.0"
    }
  }
  ```
- 运行 `npm install`

---

## 调试步骤

### 本地测试构建

1. **运行测试脚本：**
   ```bash
   # Linux/Mac
   bash test-build.sh
   
   # Windows
   test-build.bat
   ```

2. **手动步骤：**
   ```bash
   cd frontend
   npm install
   npm run build
   npx cap add android
   npx cap sync android
   cd android
   chmod +x gradlew  # Linux/Mac only
   ./gradlew assembleDebug --stacktrace
   ```

3. **检查输出：**
   ```bash
   ls -la android/app/build/outputs/apk/debug/
   ```

### GitHub Actions 调试

1. **查看详细日志：**
   - 进入 Actions 标签页
   - 点击失败的工作流
   - 展开每个步骤查看详细输出

2. **手动触发构建：**
   - Actions → Build Android APK (Debug)
   - Run workflow → Run workflow

3. **检查 Artifacts：**
   - 即使构建失败，部分 artifacts 可能已生成
   - 下载查看是否有部分成功的输出

---

## 预防措施

### 推送前检查清单

- [ ] 运行 `test-build.sh` 或 `test-build.bat`
- [ ] 确认 `frontend/dist` 目录存在
- [ ] 确认 `capacitor.config.json` 格式正确
- [ ] 确认 `package.json` 包含所有 Capacitor 依赖
- [ ] 确认 `.gitignore` 不包含必要文件
- [ ] 提交 `package-lock.json`

### 首次构建建议

1. **先测试 Debug 构建：**
   - 推送到 main 分支
   - 等待 Debug 构建成功
   - 下载并测试 APK

2. **再配置 Release 构建：**
   - 生成签名密钥
   - 配置 GitHub Secrets
   - 创建 tag 触发 Release 构建

---

## 获取帮助

### 查看日志位置

- **GitHub Actions 日志：** 仓库 → Actions → 选择工作流
- **本地 Gradle 日志：** `frontend/android/build/`
- **Capacitor 日志：** 运行时添加 `--verbose` 参数

### 常用命令

```bash
# 查看 Capacitor 版本
npx cap --version

# 查看 Android 平台信息
npx cap ls

# 更新 Capacitor
npm install @capacitor/cli@latest @capacitor/core@latest @capacitor/android@latest

# 清理并重建
cd frontend
rm -rf android node_modules
npm install
npx cap add android
npx cap sync android
```

### 参考资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [GitHub Actions 文档](https://docs.github.com/actions)
- [Android 开发者文档](https://developer.android.com/studio/build)
