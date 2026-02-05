# ZenMusic · 禅音

极简本地音乐播放器 - 回归音乐本身

## 项目结构

```
zenmusic/
├── frontend/          # Vue 3 前端应用
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── capacitor.config.json
├── backend/           # 后端服务（待开发）
├── .github/
│   └── workflows/     # GitHub Actions 自动构建
└── README.md
```

## 快速开始

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:3000/

### Android APK 构建

#### 方式一：GitHub Actions 自动构建（推荐）

1. 推送代码到 GitHub
2. GitHub Actions 自动构建 APK
3. 在 Actions 页面下载构建好的 APK

详细说明：[ANDROID_BUILD.md](./ANDROID_BUILD.md)

#### 方式二：本地构建

```bash
# 测试构建环境
bash test-build.sh  # Linux/Mac
test-build.bat      # Windows

# 手动构建
cd frontend
npm install
npm run build
npx cap add android
npx cap open android  # 在 Android Studio 中构建
```

### 后端开发

（待实现）

## 功能特性

- 🎵 本地音乐播放
- 🎨 极简扁平化设计
- 🌙 深色模式
- 📱 移动端优化
- 🔄 手势交互

## 技术栈

- **前端：** Vue 3 + Vite + Pinia
- **移动端：** Capacitor
- **后端：** Cloudflare Workers（计划中）
- **CI/CD：** GitHub Actions

## 构建状态

![Build Android APK](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/Build%20Android%20APK%20(Debug)/badge.svg)

## 文档

- [Android 构建指南](./ANDROID_BUILD.md)
- [快速设置步骤](./setup-android.md)
- [问题排查指南](./TROUBLESHOOTING.md)

## 设计理念

- **扁平化设计**：零拟物化，纯粹的视觉语言
- **极简主义**：只保留核心功能，拒绝噪点
- **深色模式**：沉浸式聆听体验
- **手势优先**：流畅的触控交互

## 许可证

MIT
