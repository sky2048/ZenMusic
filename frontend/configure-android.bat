@echo off
REM Android 网络配置脚本 - Windows 版本

echo 配置 Android 网络权限...

REM 检查 android 目录是否存在
if not exist "android" (
    echo ❌ android 目录不存在，请先运行: npx cap add android
    exit /b 1
)

REM 配置文件路径
set MANIFEST_FILE=android\app\src\main\AndroidManifest.xml
set XML_DIR=android\app\src\main\res\xml

REM 创建 XML 目录
if not exist "%XML_DIR%" mkdir "%XML_DIR%"

REM 复制网络安全配置文件
if exist "android-network-config.xml" (
    copy /Y android-network-config.xml "%XML_DIR%\network_security_config.xml" >nul
    echo ✅ 复制网络安全配置文件
) else (
    echo ⚠️  找不到 android-network-config.xml，创建默认配置...
    (
        echo ^<?xml version="1.0" encoding="utf-8"?^>
        echo ^<network-security-config^>
        echo     ^<base-config cleartextTrafficPermitted="true"^>
        echo         ^<trust-anchors^>
        echo             ^<certificates src="system" /^>
        echo             ^<certificates src="user" /^>
        echo         ^</trust-anchors^>
        echo     ^</base-config^>
        echo     ^<domain-config cleartextTrafficPermitted="true"^>
        echo         ^<domain includeSubdomains="true"^>music-crawler.sky70old.workers.dev^</domain^>
        echo         ^<domain includeSubdomains="true"^>www.gequhai.com^</domain^>
        echo         ^<domain includeSubdomains="true"^>localhost^</domain^>
        echo     ^</domain-config^>
        echo ^</network-security-config^>
    ) > "%XML_DIR%\network_security_config.xml"
    echo ✅ 创建默认网络安全配置
)

echo.
echo =========================================
echo ✅ Android 网络配置完成！
echo =========================================
echo.
echo 下一步：
echo 1. 运行: npx cap sync android
echo 2. 构建 APK 或在 Android Studio 中打开
echo.
echo 注意：你可能需要手动编辑 AndroidManifest.xml 添加以下内容：
echo.
echo 在 ^<manifest^> 标签内添加：
echo     ^<uses-permission android:name="android.permission.INTERNET" /^>
echo     ^<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /^>
echo.
echo 在 ^<application^> 标签添加属性：
echo     android:networkSecurityConfig="@xml/network_security_config"
echo     android:usesCleartextTraffic="true"
echo.

pause
