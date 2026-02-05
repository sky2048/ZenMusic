@echo off
REM 测试构建脚本 - Windows 版本

echo =========================================
echo ZenMusic Android 构建测试
echo =========================================

REM 检查 Node.js
echo.
echo 1. 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 Node.js
    exit /b 1
)
node --version
echo ✅ Node.js 已安装

REM 检查 npm
echo.
echo 2. 检查 npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 未安装 npm
    exit /b 1
)
npm --version
echo ✅ npm 已安装

REM 进入前端目录
cd frontend

REM 安装依赖
echo.
echo 3. 安装依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 依赖安装失败
    exit /b 1
)

REM 构建前端
echo.
echo 4. 构建前端...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: 前端构建失败
    exit /b 1
)

REM 检查构建输出
echo.
echo 5. 检查构建输出...
if not exist "dist" (
    echo ❌ 错误: dist 目录不存在
    exit /b 1
)
if not exist "dist\index.html" (
    echo ❌ 错误: dist\index.html 不存在
    exit /b 1
)
echo ✅ 构建输出正常

REM 检查 Capacitor 配置
echo.
echo 6. 检查 Capacitor 配置...
if not exist "capacitor.config.json" (
    echo ❌ 错误: capacitor.config.json 不存在
    exit /b 1
)
echo ✅ Capacitor 配置存在

REM 添加 Android 平台
echo.
echo 7. 添加 Android 平台...
call npx cap add android
if %ERRORLEVEL% NEQ 0 (
    echo Android 平台已存在
)

REM 同步 Capacitor
echo.
echo 8. 同步 Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误: Capacitor 同步失败
    exit /b 1
)

REM 检查 Android 项目
echo.
echo 9. 检查 Android 项目...
if not exist "android" (
    echo ❌ 错误: android 目录不存在
    exit /b 1
)
if not exist "android\gradlew.bat" (
    echo ❌ 错误: android\gradlew.bat 不存在
    exit /b 1
)
echo ✅ Android 项目正常

echo.
echo =========================================
echo ✅ 所有检查通过！
echo =========================================
echo.
echo 下一步：
echo 1. 如果你有 Android Studio，运行: npx cap open android
echo 2. 在 Android Studio 中构建 APK
echo 3. 或者推送到 GitHub 让 Actions 自动构建
echo.

cd ..
pause
