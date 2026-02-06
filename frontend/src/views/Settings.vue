<template>
  <div class="settings-page">
    <header class="header">
      <h1 class="title">设置</h1>
    </header>

    <div class="settings-list">
      <div class="section">
        <h3 class="section-title">功能</h3>
        <div class="setting-item" @click="showTimerModal = true">
          <div class="setting-info">
            <div class="setting-label">定时暂停</div>
            <div class="setting-desc" v-if="timerRemaining > 0">
              剩余 {{ formatTimerRemaining() }}
            </div>
            <div class="setting-desc" v-else>未设置</div>
          </div>
          <div class="setting-action">
            <span v-if="timerRemaining > 0">⏱</span>
            <span v-else>›</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">存储</h3>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">播放列表</div>
            <div class="setting-value">{{ playlist.length }} 首</div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">已缓存歌曲</div>
            <div class="setting-value">{{ cachedSongsCount }} 首</div>
          </div>
        </div>
        <div class="setting-item" @click="showStoragePath">
          <div class="setting-info">
            <div class="setting-label">存储位置</div>
            <div class="setting-desc storage-path">{{ storagePath }}</div>
          </div>
          <div class="setting-action">›</div>
        </div>
        <div class="setting-item" @click="confirmClearAll">
          <div class="setting-info">
            <div class="setting-label">清空所有数据</div>
            <div class="setting-desc">删除所有歌曲和缓存</div>
          </div>
          <div class="setting-action danger">清空</div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">关于</h3>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">应用名称</div>
            <div class="setting-value">{{ appName }} · 禅音</div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">版本</div>
            <div class="setting-value">v{{ appVersion }}</div>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">设计理念</div>
            <div class="setting-desc">极简 · 扁平 · 回归音乐本身</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 定时暂停模态框 -->
    <div v-if="showTimerModal" class="timer-modal" @click="showTimerModal = false">
      <div class="timer-content" @click.stop>
        <div class="timer-header">
          <h3>定时暂停</h3>
          <button class="close-btn" @click="showTimerModal = false">✕</button>
        </div>
        
        <div class="timer-body">
          <div class="timer-status" v-if="timerRemaining > 0">
            <div class="timer-icon">⏱</div>
            <div class="timer-text">
              <div class="timer-label">剩余时间</div>
              <div class="timer-time">{{ formatTimerRemaining() }}</div>
            </div>
          </div>

          <div class="timer-options">
            <button 
              v-for="option in timerOptions" 
              :key="option.value"
              class="timer-option"
              :class="{ active: selectedTimer === option.value }"
              @click="setTimer(option.value)"
            >
              <span class="option-label">{{ option.label }}</span>
            </button>
          </div>

          <button 
            v-if="timerRemaining > 0" 
            class="cancel-timer-btn"
            @click="cancelTimer"
          >
            取消定时
          </button>

          <!-- 自定义时间输入 -->
          <div v-if="showCustomInput" class="custom-input-section">
            <div class="custom-input-header">
              <h4>自定义时间</h4>
            </div>
            <div class="custom-input-body">
              <input 
                v-model="customMinutes" 
                type="number" 
                placeholder="输入分钟数"
                class="custom-input"
                min="1"
                max="999"
                @keyup.enter="setCustomTimer"
              />
              <div class="custom-input-actions">
                <button class="custom-cancel-btn" @click="cancelCustomInput">
                  取消
                </button>
                <button class="custom-confirm-btn" @click="setCustomTimer">
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'
import { storage } from '../utils/storage'
import packageInfo from '../../package.json'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

const playerStore = usePlayerStore()
const { songs, playlist } = storeToRefs(playerStore)
const { loadSongs, pause } = playerStore

const appVersion = packageInfo.version
const appName = packageInfo.name

const cachedSongsCount = ref(0)
const storagePath = ref('加载中...')

// 获取存储路径
const getStoragePath = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      // 原生平台：显示实际文件路径
      const result = await Filesystem.getUri({
        path: 'music',
        directory: Directory.Data
      })
      storagePath.value = result.uri.replace('file://', '')
    } else {
      // 浏览器：显示 IndexedDB
      storagePath.value = 'IndexedDB (浏览器本地存储)'
    }
  } catch (error) {
    console.error('获取存储路径失败:', error)
    storagePath.value = '无法获取路径'
  }
}

// 获取已缓存歌曲数量
const getCachedSongsCount = async () => {
  try {
    const allMeta = await storage.getAllMeta()
    cachedSongsCount.value = allMeta.length
  } catch (error) {
    console.error('获取缓存歌曲数量失败:', error)
    cachedSongsCount.value = 0
  }
}

// 显示存储路径（复制到剪贴板）
const showStoragePath = () => {
  if (navigator.clipboard && storagePath.value !== '加载中...') {
    navigator.clipboard.writeText(storagePath.value)
      .then(() => {
        alert('存储路径已复制到剪贴板')
      })
      .catch(() => {
        alert(`存储路径：\n${storagePath.value}`)
      })
  } else {
    alert(`存储路径：\n${storagePath.value}`)
  }
}

const showTimerModal = ref(false)
const timerRemaining = ref(0) // 剩余秒数
const selectedTimer = ref(0)
const timerInterval = ref(null)
const timerTimeout = ref(null)
const showCustomInput = ref(false)
const customMinutes = ref('')

const timerOptions = [
  { label: '15分钟', value: 15 * 60 },
  { label: '30分钟', value: 30 * 60 },
  { label: '45分钟', value: 45 * 60 },
  { label: '60分钟', value: 60 * 60 },
  { label: '90分钟', value: 90 * 60 },
  { label: '120分钟', value: 120 * 60 },
  { label: '自定义', value: -1 }
]

// 设置定时器
const setTimer = (seconds) => {
  // 如果是自定义选项
  if (seconds === -1) {
    showCustomInput.value = true
    return
  }
  
  // 取消之前的定时器
  cancelTimer()
  
  selectedTimer.value = seconds
  timerRemaining.value = seconds
  
  // 保存到 localStorage
  const endTime = Date.now() + seconds * 1000
  localStorage.setItem('timerEndTime', endTime.toString())
  
  console.log('设置定时器:', seconds, '秒，结束时间:', new Date(endTime).toLocaleString())
  
  // 开始倒计时
  startCountdown()
  
  // 设置定时暂停
  timerTimeout.value = setTimeout(() => {
    console.log('定时器时间到，暂停音乐')
    pauseMusic()
  }, seconds * 1000)
  
  console.log('定时器已设置，timeout ID:', timerTimeout.value)
}

// 设置自定义时间
const setCustomTimer = () => {
  const minutes = parseInt(customMinutes.value)
  if (isNaN(minutes) || minutes <= 0) {
    alert('请输入有效的分钟数（大于0）')
    return
  }
  
  if (minutes > 999) {
    alert('时间不能超过999分钟')
    return
  }
  
  showCustomInput.value = false
  customMinutes.value = ''
  setTimer(minutes * 60)
}

// 取消自定义输入
const cancelCustomInput = () => {
  showCustomInput.value = false
  customMinutes.value = ''
}

// 取消定时器
const cancelTimer = () => {
  console.log('取消定时器')
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  
  if (timerTimeout.value) {
    clearTimeout(timerTimeout.value)
    timerTimeout.value = null
  }
  
  timerRemaining.value = 0
  selectedTimer.value = 0
  localStorage.removeItem('timerEndTime')
}

// 开始倒计时
const startCountdown = () => {
  // 清除旧的倒计时
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  timerInterval.value = setInterval(() => {
    const endTime = parseInt(localStorage.getItem('timerEndTime') || '0')
    if (!endTime) {
      cancelTimer()
      return
    }
    
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
    timerRemaining.value = remaining
    
    if (remaining <= 0) {
      console.log('倒计时结束，暂停音乐')
      pauseMusic()
    }
  }, 1000)
}

// 格式化剩余时间
const formatTimerRemaining = () => {
  const hours = Math.floor(timerRemaining.value / 3600)
  const minutes = Math.floor((timerRemaining.value % 3600) / 60)
  const seconds = timerRemaining.value % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  } else {
    return `${seconds}秒`
  }
}

// 定时暂停音乐播放
const pauseMusic = () => {
  console.log('执行暂停音乐播放')
  
  // 暂停播放
  pause()
  
  // 取消定时器
  cancelTimer()
  
  // 显示提示
  alert('定时时间到，音乐已暂停播放')
}

// 恢复定时器状态
const restoreTimer = () => {
  const endTime = parseInt(localStorage.getItem('timerEndTime') || '0')
  if (endTime) {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
    if (remaining > 0) {
      console.log('恢复定时器，剩余时间:', remaining, '秒')
      timerRemaining.value = remaining
      startCountdown()
      
      // 重新设置定时关闭
      timerTimeout.value = setTimeout(() => {
        console.log('恢复的定时器时间到，暂停音乐')
        pauseMusic()
      }, remaining * 1000)
    } else {
      console.log('定时器已过期，清除')
      localStorage.removeItem('timerEndTime')
    }
  }
}

const confirmClearAll = () => {
  if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
    clearAllData()
  }
}

const clearAllData = async () => {
  await storage.clearAll()
  await loadSongs()
  alert('数据已清空')
}

onMounted(() => {
  restoreTimer()
  getStoragePath()
  getCachedSongsCount()
})

onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<style scoped>
.settings-page {
  width: 100%;
  height: 100%;
  background: var(--bg-dark);
  overflow-y: auto;
}

.header {
  padding: 48px 24px 24px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.settings-list {
  padding: 0 24px 100px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.setting-item {
  background: var(--bg-gray);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.setting-item:active {
  background: rgba(255, 255, 255, 0.05);
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 14px;
  color: var(--text-secondary);
}

.storage-path {
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
}

.setting-value {
  font-size: 14px;
  color: var(--text-secondary);
}

.setting-action {
  font-size: 14px;
  font-weight: 500;
  color: var(--primary);
}

.setting-action.danger {
  color: #ff3b30;
}

/* 定时关闭模态框 */
.timer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 300;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.timer-content {
  width: 100%;
  height: 75vh;
  background: var(--bg-gray);
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.timer-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  opacity: 0.6;
}

.timer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.timer-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: rgba(204, 255, 0, 0.1);
  border-radius: 16px;
  margin-bottom: 32px;
  border: 1px solid rgba(204, 255, 0, 0.3);
}

.timer-icon {
  font-size: 48px;
  line-height: 1;
}

.timer-text {
  flex: 1;
}

.timer-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.timer-time {
  font-size: 24px;
  font-weight: 600;
  color: var(--primary);
}

.timer-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.timer-option {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.timer-option:active {
  transform: scale(0.95);
}

.timer-option.active {
  background: rgba(204, 255, 0, 0.1);
  border-color: var(--primary);
}

.option-label {
  font-size: 16px;
  font-weight: 500;
  display: block;
  text-align: center;
}

.timer-option.active .option-label {
  color: var(--primary);
}

.cancel-timer-btn {
  width: 100%;
  padding: 16px;
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.cancel-timer-btn:active {
  transform: scale(0.98);
  background: rgba(255, 59, 48, 0.3);
}

/* 自定义时间输入 */
.custom-input-section {
  margin-top: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(204, 255, 0, 0.3);
}

.custom-input-header {
  margin-bottom: 16px;
}

.custom-input-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
}

.custom-input-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 16px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.custom-input:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.1);
}

.custom-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.custom-input-actions {
  display: flex;
  gap: 12px;
}

.custom-cancel-btn,
.custom-confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.custom-cancel-btn {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}

.custom-cancel-btn:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.12);
}

.custom-confirm-btn {
  background: var(--primary);
  color: var(--bg-dark);
}

.custom-confirm-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}
</style>
