#!/usr/bin/env node

/**
 * 自动修复 Android Manifest 文件
 * 添加网络权限和配置
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const XML_DIR = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'xml');
const NETWORK_CONFIG_PATH = path.join(XML_DIR, 'network_security_config.xml');

console.log('🔧 修复 Android Manifest...\n');

// 1. 检查文件是否存在
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('❌ AndroidManifest.xml 不存在');
  console.log('   请先运行: npx cap add android');
  process.exit(1);
}

// 2. 读取 Manifest 文件
let manifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
let modified = false;

// 3. 添加网络权限
if (!manifest.includes('android.permission.INTERNET')) {
  console.log('✅ 添加 INTERNET 权限');
  manifest = manifest.replace(
    /<manifest([^>]*)>/,
    '<manifest$1>\n    <uses-permission android:name="android.permission.INTERNET" />'
  );
  modified = true;
} else {
  console.log('✓  INTERNET 权限已存在');
}

if (!manifest.includes('android.permission.ACCESS_NETWORK_STATE')) {
  console.log('✅ 添加 ACCESS_NETWORK_STATE 权限');
  manifest = manifest.replace(
    /<uses-permission android:name="android.permission.INTERNET" \/>/,
    '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />'
  );
  modified = true;
} else {
  console.log('✓  ACCESS_NETWORK_STATE 权限已存在');
}

// 4. 添加网络安全配置
if (!manifest.includes('networkSecurityConfig')) {
  console.log('✅ 添加 networkSecurityConfig');
  manifest = manifest.replace(
    /<application/,
    '<application\n        android:networkSecurityConfig="@xml/network_security_config"'
  );
  modified = true;
} else {
  console.log('✓  networkSecurityConfig 已存在');
}

// 5. 添加 usesCleartextTraffic
if (!manifest.includes('usesCleartextTraffic')) {
  console.log('✅ 添加 usesCleartextTraffic');
  manifest = manifest.replace(
    /<application/,
    '<application\n        android:usesCleartextTraffic="true"'
  );
  modified = true;
} else {
  console.log('✓  usesCleartextTraffic 已存在');
}

// 6. 保存修改
if (modified) {
  fs.writeFileSync(MANIFEST_PATH, manifest, 'utf8');
  console.log('\n✅ AndroidManifest.xml 已更新');
} else {
  console.log('\n✓  AndroidManifest.xml 无需修改');
}

// 7. 创建网络安全配置文件
if (!fs.existsSync(XML_DIR)) {
  fs.mkdirSync(XML_DIR, { recursive: true });
  console.log('✅ 创建 xml 目录');
}

const networkConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">music-crawler.sky70old.workers.dev</domain>
        <domain includeSubdomains="true">workers.dev</domain>
        <domain includeSubdomains="true">www.gequhai.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;

fs.writeFileSync(NETWORK_CONFIG_PATH, networkConfig, 'utf8');
console.log('✅ 创建 network_security_config.xml');

console.log('\n🎉 配置完成！\n');
console.log('下一步：');
console.log('  1. npx cap sync android');
console.log('  2. cd android && ./gradlew assembleDebug');
console.log('  3. 安装新的 APK 到设备\n');
