<template>
  <div class="search-page">
    <header class="header">
      <button class="back-btn" @click="$emit('back')">
        <span>‹</span>
      </button>
      <div class="search-input-wrapper">
        <input 
          ref="searchInput"
          type="search" 
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索歌曲、歌手"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
    </header>

    <div class="search-content" @scroll="handleScroll">
      <!-- 搜索历史 -->
      <div v-if="!hasSearched && searchHistory.length > 0" class="search-history">
        <div class="history-header">
          <span class="history-title">搜索历史</span>
          <button class="clear-btn" @click="clearHistory">清空</button>
        </div>
        <div class="history-tags">
          <span 
            v-for="(item, index) in searchHistory" 
            :key="index"
            class="history-tag"
            @click="searchKeyword = item; handleSearch()"
          >
            {{ item }}
          </span>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="hasSearched" class="search-results">
        <div v-if="loading" class="loading">
          <p>搜索中...</p>
        </div>

        <div v-else-if="searchResults.length > 0" class="result-list">
          <div
            v-for="(song, index) in searchResults"
            :key="song.id"
            class="song-item"
            :class="{ 
              active: currentSong?.id === song.id,
              previewing: previewingSong?.id === song.id
            }"
          >
            <span class="rank" @click="previewSong(song)">{{ song.rank || index + 1 }}</span>
            <div class="song-info" @click="previewSong(song)">
              <div class="title">{{ song.name || song.title }}</div>
              <div class="artist">{{ song.artist }}</div>
            </div>
            <div class="action-buttons">
              <button 
                class="preview-btn" 
                :class="{ playing: previewingSong?.id === song.id }"
                @click.stop="previewSong(song)"
              >
                <span v-if="previewingSong?.id === song.id">❚❚</span>
                <span v-else>▶</span>
              </button>
              <button 
                class="add-btn" 
                :class="{ 
                  adding: addingButtons.has(song.id),
                  added: isInPlaylist(song.id)
                }"
                @click.stop="addToPlaylist(song)"
              >
                <span v-if="isInPlaylist(song.id)">✓</span>
                <span v-else>+</span>
              </button>
            </div>
            
            <!-- 试听进度条和歌词 -->
            <div v-if="previewingSong?.id === song.id" class="preview-info">
              <div class="preview-progress">
                <div 
                  class="preview-progress-bar"
                  @click="handlePreviewProgressClick"
                  @touchstart="handlePreviewProgressTouchStart"
                  @touchmove="handlePreviewProgressTouchMove"
                  @touchend="handlePreviewProgressTouchEnd"
                >
                  <div class="preview-progress-fill" :style="{ width: `${previewProgressPercent}%` }"></div>
                </div>
                <div class="preview-time">
                  <span>{{ formatTime(previewCurrentTime) }}</span>
                  <span>{{ formatTime(previewDuration) }}</span>
                </div>
              </div>
              <div v-if="previewCurrentLyric" class="preview-lyric">
                {{ previewCurrentLyric }}
              </div>
            </div>
          </div>

          <!-- 加载更多提示 -->
          <div v-if="loadingMore" class="loading-more">
            <p>加载中...</p>
          </div>
          <div v-else-if="!hasMore" class="no-more">
            <p>没有更多了</p>
          </div>
        </div>

        <div v-else class="empty">
          <p class="empty-icon">🔍</p>
          <p class="empty-text">没有找到相关歌曲</p>
          <p class="empty-hint">换个关键词试试</p>
        </div>
      </div>

      <!-- 默认状态 -->
      <div v-if="!hasSearched && searchHistory.length === 0" class="default-state">
        <p class="default-icon">🎵</p>
        <p class="default-text">搜索你喜欢的音乐</p>
      </div>
    </div>

    <Toast :message="toastMessage" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'
import Toast from '../components/Toast.vue'

const emit = defineEmits(['back', 'playSong'])

const playerStore = usePlayerStore()
const { currentSong, playlist } = storeToRefs(playerStore)

const searchInput = ref(null)
const searchKeyword = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const searchResults = ref([])
const searchHistory = ref([])
const currentPage = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)

const toastMessage = ref('')
const addingButtons = ref(new Set())
const previewingSong = ref(null) // 当前试听的歌曲
const previewAudio = new Audio() // 试听音频对象
const previewProgress = ref(0)
const previewDuration = ref(0)
const previewCurrentTime = ref(0)
const previewLyrics = ref('')
const previewDragging = ref(false) // 是否正在拖动进度条

const API_BASE = 'https://music.fydh.de5.net'

// 试听音频事件
previewAudio.addEventListener('timeupdate', () => {
  if (!previewDragging.value) {
    previewCurrentTime.value = previewAudio.currentTime
  }
})

previewAudio.addEventListener('loadedmetadata', () => {
  previewDuration.value = previewAudio.duration
})

previewAudio.addEventListener('ended', () => {
  stopPreview()
})

// 计算试听进度
const previewProgressPercent = computed(() => {
  return previewDuration.value ? (previewCurrentTime.value / previewDuration.value) * 100 : 0
})

// 检查歌曲是否在播放列表中
const isInPlaylist = (songId) => {
  return playlist.value.some(s => s.id === songId)
}

// 试听歌曲
const previewSong = async (song) => {
  try {
    // 如果正在试听同一首歌，则停止
    if (previewingSong.value?.id === song.id) {
      stopPreview()
      return
    }
    
    // 停止之前的试听
    stopPreview()
    
    // 获取歌曲详情
    const response = await fetch(`${API_BASE}/api/song/${song.id}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      const songDetail = result.data
      previewingSong.value = song
      previewLyrics.value = songDetail.lyrics || ''
      
      previewAudio.src = songDetail.musicUrl
      await previewAudio.play()
    }
  } catch (error) {
    console.error('试听失败:', error)
    showToast('试听失败')
  }
}

// 停止试听
const stopPreview = () => {
  previewAudio.pause()
  previewAudio.currentTime = 0
  previewingSong.value = null
  previewLyrics.value = ''
  previewCurrentTime.value = 0
  previewDuration.value = 0
}

// 格式化时间
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 解析试听歌词
const previewParsedLyrics = computed(() => {
  if (!previewLyrics.value) return []
  
  const lines = previewLyrics.value.split('\n')
  const result = []
  
  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const time = minutes * 60 + seconds
      const text = match[4].trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  
  return result
})

// 试听进度条触摸事件
const handlePreviewProgressTouchStart = (e) => {
  previewDragging.value = true
  updatePreviewProgress(e.touches[0])
}

const handlePreviewProgressTouchMove = (e) => {
  if (previewDragging.value) {
    e.preventDefault() // 防止页面滚动
    updatePreviewProgress(e.touches[0])
  }
}

const handlePreviewProgressTouchEnd = () => {
  previewDragging.value = false
}

const updatePreviewProgress = (touch) => {
  const progressBar = touch.target.closest('.preview-progress-bar')
  if (!progressBar) return
  
  const rect = progressBar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100))
  const newTime = (percent / 100) * previewDuration.value
  
  previewCurrentTime.value = newTime
  previewAudio.currentTime = newTime
}

// 试听进度条点击（备用）
const handlePreviewProgressClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  const newTime = (percent / 100) * previewDuration.value
  previewAudio.currentTime = newTime
  previewCurrentTime.value = newTime
}

// 当前试听歌词
const previewCurrentLyric = computed(() => {
  if (previewParsedLyrics.value.length === 0) return ''
  
  const time = previewCurrentTime.value
  let current = ''
  
  for (let i = 0; i < previewParsedLyrics.value.length; i++) {
    if (previewParsedLyrics.value[i].time <= time) {
      current = previewParsedLyrics.value[i].text
    } else {
      break
    }
  }
  
  return current
})

// 添加到播放列表
const addToPlaylist = async (song) => {
  try {
    // 添加动画效果
    addingButtons.value.add(song.id)
    setTimeout(() => {
      addingButtons.value.delete(song.id)
    }, 600)
    
    const exists = playerStore.playlist.find(s => s.id === song.id)
    if (exists) {
      showToast('已在播放列表中')
    } else {
      // 先获取完整的歌曲信息
      const response = await fetch(`${API_BASE}/api/song/${song.id}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        const songDetail = result.data
        const fullSong = {
          id: songDetail.id,
          title: songDetail.title,
          name: songDetail.title,
          artist: songDetail.artist,
          cover: songDetail.cover,
          musicUrl: songDetail.musicUrl
        }
        
        playerStore.addToPlaylist(fullSong)
        showToast('已添加到播放列表')
        
        // 如果正在试听这首歌，停止试听
        if (previewingSong.value?.id === song.id) {
          stopPreview()
        }
      }
    }
  } catch (error) {
    console.error('添加失败:', error)
    showToast('添加失败，请重试')
  }
}

// 显示提示
const showToast = (message) => {
  toastMessage.value = message
  setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

// 执行搜索
const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  hasSearched.value = true
  loading.value = true
  searchResults.value = []
  currentPage.value = 1

  try {
    // 保存搜索历史
    saveSearchHistory(keyword)

    // 调用后端搜索接口
    const response = await fetch(`${API_BASE}/api/search?keyword=${encodeURIComponent(keyword)}`)
    const result = await response.json()

    console.log('搜索结果:', result)

    if (result.success && result.data) {
      searchResults.value = result.data.songs || []
      hasMore.value = result.data.pagination?.hasMore || false
    }
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return

  const keyword = searchKeyword.value.trim()
  if (!keyword) return

  loadingMore.value = true
  currentPage.value++

  try {
    const response = await fetch(`${API_BASE}/api/search?keyword=${encodeURIComponent(keyword)}&page=${currentPage.value}`)
    const result = await response.json()

    console.log('加载更多结果:', result)

    if (result.success && result.data) {
      searchResults.value = [...searchResults.value, ...(result.data.songs || [])]
      hasMore.value = result.data.pagination?.hasMore || false
    }
  } catch (error) {
    console.error('加载更多失败:', error)
  } finally {
    loadingMore.value = false
  }
}

// 滚动加载
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMore()
  }
}

// 保存搜索历史
const saveSearchHistory = (keyword) => {
  // 移除重复项
  const filtered = searchHistory.value.filter(item => item !== keyword)
  // 添加到开头
  searchHistory.value = [keyword, ...filtered].slice(0, 10) // 最多保存10条
  // 保存到 localStorage
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 清空搜索历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

onMounted(() => {
  // 加载搜索历史
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
  
  // 自动聚焦输入框
  searchInput.value?.focus()
})

// 组件卸载时停止试听
onUnmounted(() => {
  stopPreview()
})
</script>

<style scoped>
.search-page {
  width: 100%;
  height: 100%;
  background: var(--bg-dark);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 48px 20px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--text-primary);
  transition: transform 0.2s;
}

.back-btn:active {
  transform: scale(0.9);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 16px;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.search-btn {
  padding: 4px 16px;
  background: var(--primary);
  color: var(--bg-dark);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s;
}

.search-btn:active {
  transform: scale(0.95);
}

.search-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

/* 搜索历史 */
.search-history {
  margin-top: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.clear-btn {
  font-size: 14px;
  color: var(--text-secondary);
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-tag {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.history-tag:active {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(0.95);
}

/* 搜索结果 */
.search-results {
  margin-top: 20px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.song-item {
  display: grid;
  grid-template-columns: 50px 1fr 100px;
  gap: 12px;
  align-items: center;
  padding: 18px 12px;
  min-height: 80px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 12px;
  position: relative;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
}

.song-item.previewing {
  grid-template-rows: auto auto;
  padding-bottom: 12px;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.2);
}

.song-item:active {
  background: rgba(255, 255, 255, 0.12);
}

.song-item.active {
  background: rgba(204, 255, 0, 0.12);
  border-color: rgba(204, 255, 0, 0.5);
}

.song-item.active .title {
  color: var(--primary);
}

.rank {
  text-align: center;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  cursor: pointer;
}

.song-info {
  flex: 1;
  overflow: hidden;
  padding: 0 12px;
  cursor: pointer;
}

.title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.95);
}

.artist {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  font-size: 16px;
  color: var(--text-primary);
  transition: all 0.2s;
  flex-shrink: 0;
}

.preview-btn.playing {
  background: rgba(204, 255, 0, 0.35);
  color: var(--primary);
}

.preview-btn:active {
  transform: scale(0.9);
}

.add-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(204, 255, 0, 0.25);
  border-radius: 50%;
  font-size: 24px;
  color: var(--primary);
  transition: all 0.2s;
  flex-shrink: 0;
  position: relative;
}

.add-btn.added {
  background: rgba(204, 255, 0, 0.45);
}

.add-btn:active {
  transform: scale(0.9);
  background: rgba(204, 255, 0, 0.35);
}

.add-btn.adding {
  animation: addPulse 0.6s ease;
}

@keyframes addPulse {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2) rotate(90deg);
  }
  50% {
    transform: scale(0.9) rotate(180deg);
  }
  75% {
    transform: scale(1.1) rotate(270deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
}

/* 试听信息 */
.preview-info {
  grid-column: 1 / -1;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-progress {
  margin-bottom: 12px;
}

.preview-progress-bar {
  height: 6px;
  background: transparent;
  border-radius: 3px;
  overflow: visible;
  margin-bottom: 8px;
  cursor: pointer;
  position: relative;
  padding: 12px 0;
  margin: -12px 0 8px 0;
  touch-action: none;
}

.preview-progress-bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 12px;
  height: 6px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.preview-progress-fill {
  position: absolute;
  left: 0;
  top: 12px;
  height: 6px;
  background: var(--primary);
  transition: width 0.1s;
  border-radius: 3px;
  pointer-events: none;
  z-index: 1;
}

.preview-time {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 4px;
}

.preview-lyric {
  text-align: center;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  background: rgba(204, 255, 0, 0.08);
  border-radius: 8px;
  line-height: 1.6;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(204, 255, 0, 0.2);
}

/* 空状态 */
.loading,
.empty,
.default-state {
  text-align: center;
  padding: 80px 24px;
}

.empty-icon,
.default-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text,
.default-text {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.loading {
  color: var(--text-secondary);
}

.loading-more,
.no-more {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.6;
}
</style>
