<template>
  <div class="player-page">
    <div v-if="!currentSong" class="empty">
      <div class="empty-cover">
        <span class="empty-icon">♪</span>
      </div>
      <p class="empty-text">暂无播放</p>
      <p class="empty-hint">去主页选择一首歌曲开始播放</p>
      <button class="goto-home-btn" @click="handleGoHome">
        <span>去选歌</span>
      </button>
    </div>

    <div v-else class="player-content">
      <div class="backdrop" :style="backdropStyle"></div>
      
      <div class="content">
        <div class="cover-container">
          <div class="cover">
            <img v-if="currentSong.cover" :src="currentSong.cover" alt="" />
            <div v-else class="cover-placeholder">♪</div>
          </div>
        </div>

        <div class="info">
          <h2 class="title">{{ currentSong.title || currentSong.name }}</h2>
          <p class="artist">{{ currentSong.artist }}</p>
        </div>

        <div class="lyric-section" v-if="currentLyric">
          <p class="current-lyric">{{ currentLyric }}</p>
        </div>

        <div class="progress-section">
          <div class="progress-bar" @click="handleProgressClick">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
            <div class="progress-thumb" :style="{ left: `${progress}%` }"></div>
          </div>
          <div class="time">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="controls">
          <button class="mode-btn" @click="handleTogglePlayMode" :title="playModeInfo.text">
            <span>{{ playModeInfo.icon }}</span>
          </button>
          <button class="control-btn" @click="prev">
            <span>⏮</span>
          </button>
          <button class="control-btn play" @click="toggle">
            <span v-if="isPlaying">❚❚</span>
            <span v-else>▶</span>
          </button>
          <button class="control-btn" @click="next">
            <span>⏭</span>
          </button>
          <button class="playlist-btn" @click="handleShowPlaylist">
            <span>☰</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 播放列表模态框 -->
    <div v-if="showPlaylist" class="playlist-modal" @click="handleClosePlaylist">
      <div class="playlist-content" @click.stop>
        <div class="playlist-header">
          <h3>播放列表 ({{ playlist.length }})</h3>
          <button class="close-btn" @click="handleClosePlaylist">✕</button>
        </div>
        
        <div class="playlist-list">
          <div
            v-for="(song, index) in playlist"
            :key="song.id"
            class="playlist-item"
            :class="{ active: currentSong?.id === song.id }"
          >
            <div class="playlist-item-info" @click="handlePlayFromList(index)">
              <span class="playlist-index">{{ index + 1 }}</span>
              <div class="playlist-song-info">
                <div class="playlist-title">{{ song.title || song.name }}</div>
                <div class="playlist-artist">{{ song.artist }}</div>
              </div>
            </div>
            <button class="playlist-delete" @click="handleRemoveFromList(song.id)">
              <span>✕</span>
            </button>
          </div>

          <div v-if="playlist.length === 0" class="playlist-empty">
            <div class="playlist-empty-icon">♪</div>
            <p class="playlist-empty-text">播放列表为空</p>
            <p class="playlist-empty-hint">去主页添加喜欢的歌曲吧</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'

const emit = defineEmits(['switchTab'])

const playerStore = usePlayerStore()
const { currentSong, isPlaying, progress, currentTime, duration, lyrics, playMode, playlist } = storeToRefs(playerStore)
const { toggle, prev, next, seek, togglePlayMode, removeFromPlaylist, playFromPlaylist } = playerStore

const showPlaylist = ref(false)

const handleGoHome = () => {
  emit('switchTab', 'home')
}

// 播放模式图标和文字
const playModeInfo = computed(() => {
  const modes = {
    order: { icon: '➡️', text: '顺序播放' },
    random: { icon: '🔀', text: '随机播放' },
    single: { icon: '🔂', text: '单曲循环' },
    loop: { icon: '🔁', text: '列表循环' }
  }
  return modes[playMode.value] || modes.order
})

const handleTogglePlayMode = () => {
  const newMode = togglePlayMode()
  console.log('切换播放模式:', newMode)
}

const handleShowPlaylist = () => {
  showPlaylist.value = true
}

const handleClosePlaylist = () => {
  showPlaylist.value = false
}

const handlePlayFromList = (index) => {
  playFromPlaylist(index)
  showPlaylist.value = false
}

const handleRemoveFromList = (songId) => {
  removeFromPlaylist(songId)
  
  // 如果删除后播放列表为空，关闭模态框
  if (playlist.value.length === 0) {
    showPlaylist.value = false
  }
}

const backdropStyle = computed(() => {
  if (!currentSong.value?.cover) return {}
  return {
    backgroundImage: `url(${currentSong.value.cover})`
  }
})

const handleProgressClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = ((e.clientX - rect.left) / rect.width) * 100
  seek(percent)
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 解析歌词
const parsedLyrics = computed(() => {
  if (!lyrics.value) return []
  
  const lines = lyrics.value.split('\n')
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

// 当前歌词
const currentLyric = computed(() => {
  if (parsedLyrics.value.length === 0) return ''
  
  const time = currentTime.value
  let current = ''
  
  for (let i = 0; i < parsedLyrics.value.length; i++) {
    if (parsedLyrics.value[i].time <= time) {
      current = parsedLyrics.value[i].text
    } else {
      break
    }
  }
  
  return current
})
</script>

<style scoped>
.player-page {
  width: 100%;
  height: 100%;
  background: var(--bg-dark);
  position: relative;
}

.empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 20px;
}

.empty-cover {
  width: 200px;
  height: 200px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(204, 255, 0, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(204, 255, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.empty-icon {
  font-size: 80px;
  color: var(--primary);
  opacity: 0.5;
}

.empty-text {
  font-size: 20px;
  color: var(--text-primary);
  font-weight: 600;
}

.empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.6;
  text-align: center;
  line-height: 1.6;
}

.goto-home-btn {
  margin-top: 20px;
  padding: 12px 32px;
  background: var(--primary);
  color: var(--bg-dark);
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s;
}

.goto-home-btn:active {
  transform: scale(0.95);
}

.player-content {
  height: 100%;
  position: relative;
}

.backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(80px);
  opacity: 0.3;
}

.content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 24px 24px;
}

.cover-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.cover {
  width: 70vw;
  height: 70vw;
  max-width: 320px;
  max-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-gray);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  color: var(--text-secondary);
}

.info {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.artist {
  font-size: 16px;
  color: var(--text-secondary);
}

.lyric-section {
  text-align: center;
  margin-bottom: 24px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.current-lyric {
  font-size: 18px;
  color: var(--text-primary);
  line-height: 1.6;
  padding: 0 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-section {
  margin-bottom: 32px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.1s;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--primary);
  border-radius: 50%;
  transition: left 0.1s;
}

.time {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
}

.mode-btn,
.playlist-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.2s;
  opacity: 0.8;
}

.mode-btn:active,
.playlist-btn:active {
  transform: scale(0.9);
}

.control-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: transform 0.2s;
}

.control-btn.play {
  width: 72px;
  height: 72px;
  background: var(--primary);
  border-radius: 50%;
  font-size: 28px;
  color: var(--bg-dark);
}

.control-btn:active {
  transform: scale(0.9);
}

/* 播放列表模态框 */
.playlist-modal {
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

.playlist-content {
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

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.playlist-header h3 {
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

.playlist-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.playlist-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  transition: background 0.2s;
}

.playlist-item.active {
  background: rgba(204, 255, 0, 0.1);
}

.playlist-item.active .playlist-title {
  color: var(--primary);
}

.playlist-item-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}

.playlist-index {
  width: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.playlist-song-info {
  flex: 1;
  overflow: hidden;
}

.playlist-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-artist {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.playlist-delete {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  opacity: 0.5;
  transition: all 0.2s;
}

.playlist-delete:active {
  opacity: 1;
  transform: scale(0.9);
}

.playlist-empty {
  text-align: center;
  padding: 60px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.playlist-empty-icon {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(204, 255, 0, 0.1) 0%, rgba(204, 255, 0, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(204, 255, 0, 0.3);
  font-size: 48px;
  color: var(--primary);
  opacity: 0.5;
  margin-bottom: 8px;
}

.playlist-empty-text {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.playlist-empty-hint {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0.6;
}
</style>
