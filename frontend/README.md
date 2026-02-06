# ZenMusic 前端

极简本地音乐播放器 - 基于 Vue 3 + Capacitor 的跨平台音乐应用

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 快速的前端构建工具
- Pinia - Vue 状态管理
- Capacitor - 跨平台原生应用框架
- LocalForage - 本地存储

## 开发环境要求

- Node.js 16+
- npm 或 yarn

### Android 开发额外要求
- Android Studio
- JDK 17+
- Android SDK

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 本地开发（Web）
```bash
npm run dev
```
访问 http://localhost:5173

### 3. 预览生产构建
```bash
npm run build
npm run preview
```

## Android 开发

### 初次构建
```bash
# 构建 Web 资源并同步到 Android
npm run android:build

# 打开 Android Studio
npm run android
```

### 日常开发流程
```bash
# 1. 修改代码后重新构建
npm run build

# 2. 同步到 Android 项目
npx cap sync android

# 3. 在 Android Studio 中运行或打包
```

### 修复 Android 配置
```bash
npm run android:fix
```

## 项目结构

```
frontend/
├── src/
│   ├── components/     # Vue 组件
│   ├── stores/         # Pinia 状态管理
│   ├── App.vue         # 根组件
│   └── main.js         # 入口文件
├── android/            # Android 原生项目
├── dist/               # 构建输出目录
├── public/             # 静态资源
├── capacitor.config.json  # Capacitor 配置
└── package.json
```

## 构建发布

### Web 版本
```bash
npm run build
# 产物在 dist/ 目录
```

### Android APK
1. 构建 Web 资源：`npm run build`
2. 同步到 Android：`npx cap sync android`
3. 打开 Android Studio：`npm run android`
4. 在 Android Studio 中：Build → Build Bundle(s) / APK(s) → Build APK(s)

### Android AAB（Google Play）
1. 同上步骤 1-3
2. 在 Android Studio 中：Build → Generate Signed Bundle / APK
3. 选择 Android App Bundle
4. 配置签名密钥
5. 选择 release 构建类型

## 常见问题

### 1. Android 构建失败
- 确保已安装 Android Studio 和 JDK 17+
- 检查 `android/local.properties` 中的 SDK 路径
- 运行 `npm run android:fix` 修复配置

### 2. 音频播放问题
- 检查 `capacitor.config.json` 中的网络权限配置
- 确保 Android 清单文件包含必要权限

### 3. 热更新不生效
- 确保运行了 `npx cap sync android`
- 清理 Android 项目缓存：Build → Clean Project

## 版本信息

当前版本：1.0.4

## 许可证

MIT
