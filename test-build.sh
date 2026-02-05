#!/bin/bash

# 测试构建脚本 - 在推送到 GitHub 前本地验证

set -e

echo "========================================="
echo "ZenMusic Android 构建测试"
echo "========================================="

# 检查 Node.js
echo ""
echo "1. 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi
echo "✅ Node.js 版本: $(node --version)"

# 检查 npm
echo ""
echo "2. 检查 npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未安装 npm"
    exit 1
fi
echo "✅ npm 版本: $(npm --version)"

# 进入前端目录
cd frontend

# 安装依赖
echo ""
echo "3. 安装依赖..."
npm install

# 构建前端
echo ""
echo "4. 构建前端..."
npm run build

# 检查构建输出
echo ""
echo "5. 检查构建输出..."
if [ ! -d "dist" ]; then
    echo "❌ 错误: dist 目录不存在"
    exit 1
fi
if [ ! -f "dist/index.html" ]; then
    echo "❌ 错误: dist/index.html 不存在"
    exit 1
fi
echo "✅ 构建输出正常"
echo "   dist 目录大小: $(du -sh dist | cut -f1)"

# 检查 Capacitor 配置
echo ""
echo "6. 检查 Capacitor 配置..."
if [ ! -f "capacitor.config.json" ]; then
    echo "❌ 错误: capacitor.config.json 不存在"
    exit 1
fi
echo "✅ Capacitor 配置存在"

# 添加 Android 平台
echo ""
echo "7. 添加 Android 平台..."
npx cap add android || echo "Android 平台已存在"

# 同步 Capacitor
echo ""
echo "8. 同步 Capacitor..."
npx cap sync android

# 检查 Android 项目
echo ""
echo "9. 检查 Android 项目..."
if [ ! -d "android" ]; then
    echo "❌ 错误: android 目录不存在"
    exit 1
fi
if [ ! -f "android/gradlew" ]; then
    echo "❌ 错误: android/gradlew 不存在"
    exit 1
fi
echo "✅ Android 项目正常"

# 设置 gradlew 权限
echo ""
echo "10. 设置 gradlew 权限..."
chmod +x android/gradlew
echo "✅ gradlew 权限已设置"

echo ""
echo "========================================="
echo "✅ 所有检查通过！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 如果你有 Android Studio，运行: npx cap open android"
echo "2. 在 Android Studio 中构建 APK"
echo "3. 或者推送到 GitHub 让 Actions 自动构建"
echo ""
