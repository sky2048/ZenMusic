#!/bin/bash

# Android 网络配置脚本

echo "配置 Android 网络权限..."

# 检查 android 目录是否存在
if [ ! -d "android" ]; then
    echo "❌ android 目录不存在，请先运行: npx cap add android"
    exit 1
fi

# 1. 配置 AndroidManifest.xml - 添加网络权限
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST_FILE" ]; then
    echo "✅ 配置 AndroidManifest.xml..."
    
    # 检查是否已经有 INTERNET 权限
    if ! grep -q "android.permission.INTERNET" "$MANIFEST_FILE"; then
        # 在 <manifest> 标签后添加权限
        sed -i '/<manifest/a\    <uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />' "$MANIFEST_FILE"
        echo "  - 添加网络权限"
    else
        echo "  - 网络权限已存在"
    fi
    
    # 添加 network security config
    if ! grep -q "networkSecurityConfig" "$MANIFEST_FILE"; then
        sed -i 's/<application/<application\n        android:networkSecurityConfig="@xml\/network_security_config"/' "$MANIFEST_FILE"
        echo "  - 添加网络安全配置"
    else
        echo "  - 网络安全配置已存在"
    fi
    
    # 添加 usesCleartextTraffic
    if ! grep -q "usesCleartextTraffic" "$MANIFEST_FILE"; then
        sed -i 's/<application/<application\n        android:usesCleartextTraffic="true"/' "$MANIFEST_FILE"
        echo "  - 允许明文流量"
    else
        echo "  - 明文流量已允许"
    fi
else
    echo "❌ 找不到 AndroidManifest.xml"
    exit 1
fi

# 2. 复制网络安全配置文件
XML_DIR="android/app/src/main/res/xml"
mkdir -p "$XML_DIR"

if [ -f "android-network-config.xml" ]; then
    cp android-network-config.xml "$XML_DIR/network_security_config.xml"
    echo "✅ 复制网络安全配置文件"
else
    echo "⚠️  找不到 android-network-config.xml，创建默认配置..."
    cat > "$XML_DIR/network_security_config.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">music-crawler.sky70old.workers.dev</domain>
        <domain includeSubdomains="true">www.gequhai.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
EOF
    echo "✅ 创建默认网络安全配置"
fi

echo ""
echo "========================================="
echo "✅ Android 网络配置完成！"
echo "========================================="
echo ""
echo "下一步："
echo "1. 运行: npx cap sync android"
echo "2. 构建 APK 或在 Android Studio 中打开"
echo ""
