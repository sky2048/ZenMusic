<template>
  <div 
    class="home"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <header class="header">
      <h1 class="title">禅音</h1>
    </header>

    <div class="search-bar" @click="openSearch">
      <span class="search-icon">🔍</span>
      <span class="search-placeholder">搜索歌曲、歌手</span>
      <button class="import-btn" @click.stop="triggerImport">
        <span class="heart-icon">🧡</span>
      </button>
      <input ref="fileInput" type="file" accept="audio/*" multiple @change="handleImport" />
    </div>

    <div class="categories" ref="categoriesRef">
      <div 
        v-for="category in categories" 
        :key="category.id"
        :ref="el => { if (el) categoryRefs[category.id] = el }"
        class="category-item"
        :class="{ active: currentCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </div>
    </div>

    <div class="song-list" :key="currentCategory" ref="songListRef">
      <transition name="fade" mode="out-in">
        <div :key="currentCategory + '-content'">
          <div
            v-for="(song, index) in filteredSongs"
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
          
          <div v-if="loadingMore" class="loading-more">
            <p>加载更多...</p>
          </div>
          
          <div v-else-if="!hasMore && filteredSongs.length > 0" class="no-more">
            <p>没有更多了</p>
          </div>
          
          <div v-if="loading" class="loading">
            <p>加载中...</p>
          </div>
          
          <div v-else-if="filteredSongs.length === 0" class="empty">
            <p class="empty-text">暂无数据</p>
            <p class="empty-hint">切换其他榜单或导入本地音乐</p>
          </div>
        </div>
      </transition>
    </div>

    <Toast :message="toastMessage" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'
import Toast from '../components/Toast.vue'

const emit = defineEmits(['switchTab', 'openSearch'])

const playerStore = usePlayerStore()
const { songs, currentSong, playlist } = storeToRefs(playerStore)
const { loadSongs, importFile, play } = playerStore

const toastMessage = ref('')
const addingButtons = ref(new Set())
const previewingSong = ref(null) // 当前试听的歌曲
const previewAudio = new Audio() // 试听音频对象
const previewProgress = ref(0)
const previewDuration = ref(0)
const previewCurrentTime = ref(0)
const previewLyrics = ref('')
const previewDragging = ref(false) // 是否正在拖动进度条

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

const fileInput = ref(null)
const currentCategory = ref('hot')
const categoriesRef = ref(null)
const categoryRefs = ref({})
const rankSongs = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(true)
const songListRef = ref(null)

// 滑动相关
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

const API_BASE = 'https://music-crawler.sky70old.workers.dev'

const categories = [
  { id: 'hot', apiId: 'hot-music', name: '热门榜' },
  { id: 'rise', apiId: 'surge', name: '飙升榜' },
  { id: 'new', apiId: 'new', name: '新歌榜' },
  { id: 'douyin', apiId: 'douyin', name: '抖音榜' },
  { id: 'nostalgia', apiId: 'jingdian', name: '怀旧榜' },
  { id: 'electronic', apiId: 'dianyin', name: '电音榜' },
  { id: 'dj', apiId: 'wwdj', name: 'DJ榜' }
]

// 当前榜单信息
const currentCategoryInfo = computed(() => {
  return categories.find(c => c.id === currentCategory.value) || categories[0]
})

// 获取榜单数据（分页）
const fetchRankData = async (categoryId, page = 1, append = false) => {
  const category = categories.find(c => c.id === categoryId)
  if (!category) return
  
  if (page === 1) {
    loading.value = true
    rankSongs.value = [] // 清空旧数据
    currentPage.value = 1 // 重置页码
  } else {
    loadingMore.value = true
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/rank/${category.apiId}?page=${page}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      const newSongs = result.data.songs || []
      
      if (append) {
        rankSongs.value = [...rankSongs.value, ...newSongs]
      } else {
        rankSongs.value = newSongs
      }
      
      // 更新分页信息
      if (result.data.pagination) {
        hasMore.value = result.data.pagination.hasMore
        currentPage.value = result.data.pagination.currentPage || page
      } else {
        // 如果没有分页信息，手动更新
        currentPage.value = page
        hasMore.value = newSongs.length >= 10 // 假设每页10条
      }
    }
  } catch (error) {
    console.error('获取榜单数据失败:', error)
    if (!append) {
      rankSongs.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || loading.value) return
  const nextPage = currentPage.value + 1
  console.log('加载更多，当前页:', currentPage.value, '下一页:', nextPage)
  await fetchRankData(currentCategory.value, nextPage, true)
}

// 监听滚动事件
const handleScroll = (e) => {
  const element = e.target
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // 距离底部 200px 时加载更多
  if (scrollHeight - scrollTop - clientHeight < 200) {
    loadMore()
  }
}

// 显示的歌曲列表（榜单数据）
const displaySongs = computed(() => {
  return rankSongs.value.length > 0 ? rankSongs.value : songs.value
})

// 过滤后的歌曲列表
const filteredSongs = computed(() => {
  return displaySongs.value
})

// 选择分类并滚动到可见位置
const selectCategory = async (categoryId) => {
  if (categoryId === currentCategory.value) return // 避免重复加载
  
  currentCategory.value = categoryId
  currentPage.value = 1
  hasMore.value = true
  
  // 先滚动分类标签
  await nextTick()
  scrollCategoryIntoView(categoryId)
  
  // 滚动列表到顶部
  if (songListRef.value) {
    songListRef.value.scrollTop = 0
  }
  
  // 再加载数据
  await fetchRankData(categoryId, 1, false)
}

// 滚动分类标签到可见位置
const scrollCategoryIntoView = (categoryId) => {
  const categoryElement = categoryRefs.value[categoryId]
  const containerElement = categoriesRef.value
  
  if (categoryElement && containerElement) {
    const elementLeft = categoryElement.offsetLeft
    const elementWidth = categoryElement.offsetWidth
    const containerWidth = containerElement.offsetWidth
    const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2)
    
    containerElement.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
  }
}

// 切换到上一个分类
const prevCategory = () => {
  const currentIndex = categories.findIndex(c => c.id === currentCategory.value)
  if (currentIndex > 0) {
    selectCategory(categories[currentIndex - 1].id)
  }
}

// 切换到下一个分类
const nextCategory = () => {
  const currentIndex = categories.findIndex(c => c.id === currentCategory.value)
  if (currentIndex < categories.length - 1) {
    selectCategory(categories[currentIndex + 1].id)
  }
}

// 触摸开始
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  touchStartY.value = e.touches[0].clientY
  isSwiping.value = false
}

// 触摸移动
const handleTouchMove = (e) => {
  if (!touchStartX.value) return
  
  const touchX = e.touches[0].clientX
  const touchY = e.touches[0].clientY
  const diffX = touchX - touchStartX.value
  const diffY = touchY - touchStartY.value
  
  // 判断是否为横向滑动（横向移动距离大于纵向）
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
    isSwiping.value = true
  }
}

// 触摸结束
const handleTouchEnd = (e) => {
  if (!isSwiping.value || !touchStartX.value) {
    touchStartX.value = 0
    touchStartY.value = 0
    return
  }
  
  const touchX = e.changedTouches[0].clientX
  const diffX = touchX - touchStartX.value
  
  // 左滑（下一个）
  if (diffX < -50) {
    nextCategory()
  }
  // 右滑（上一个）
  else if (diffX > 50) {
    prevCategory()
  }
  
  touchStartX.value = 0
  touchStartY.value = 0
  isSwiping.value = false
}

const triggerImport = () => {
  fileInput.value?.click()
}

const openSearch = () => {
  emit('openSearch')
}

const handleImport = async (e) => {
  const files = Array.from(e.target.files)
  for (const file of files) {
    await importFile(file)
  }
  e.target.value = ''
}

// 播放歌曲已移除，现在点击内容卡只会试听

onMounted(() => {
  loadSongs()
  // 默认加载热门榜第1页
  fetchRankData('hot', 1, false)
  
  // 添加滚动监听
  if (songListRef.value) {
    songListRef.value.addEventListener('scroll', handleScroll)
  }
})

// 组件卸载时停止试听
onUnmounted(() => {
  stopPreview()
  if (songListRef.value) {
    songListRef.value.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  background: var(--bg-dark);
  display: flex;
  flex-direction: column;
}

.header {
  padding: 48px 24px 20px;
  text-align: center;
  flex-shrink: 0;
}

.header .title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 2px;
}

.search-bar {
  margin: 0 20px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.search-icon {
  font-size: 18px;
  opacity: 0.7;
}

.search-placeholder {
  flex: 1;
  color: var(--text-secondary);
  font-size: 16px;
  opacity: 0.7;
}

.import-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.import-btn:active {
  transform: scale(0.9);
}

.heart-icon {
  font-size: 20px;
}

.categories {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 0 20px 20px;
  flex-shrink: 0;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.categories::-webkit-scrollbar {
  display: none;
}

.category-item {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
}

.category-item.active {
  background: rgba(204, 255, 0, 0.15);
  color: var(--primary);
  border-color: var(--primary);
}

.category-item:active {
  transform: scale(0.95);
}

.song-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
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

.song-info .title {
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

.empty {
  text-align: center;
  padding: 80px 24px;
}

.empty-text {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
  opacity: 1;
}

.loading {
  text-align: center;
  padding: 80px 24px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-more {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.no-more {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  opacity: 1;
}

/* 切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
