<template>
  <div 
    class="full-player"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="{ transform: `translateY(${offsetY}px)` }"
  >
    <div class="backdrop" :style="backdropStyle"></div>
    
    <div class="content">
      <button class="close-btn" @click="$emit('close')">
        <span>⌄</span>
      </button>

      <div class="cover-container">
        <div class="cover">
          <img v-if="currentSong?.cover" :src="currentSong.cover" alt="" />
          <div v-else class="cover-placeholder">♪</div>
        </div>
      </div>

      <div class="info">
        <h2 class="title">{{ currentSong?.title }}</h2>
        <p class="artist">{{ currentSong?.artist }}</p>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'

const emit = defineEmits(['close'])

const playerStore = usePlayerStore()
const { currentSong, isPlaying, progress, currentTime, duration } = storeToRefs(playerStore)
const { toggle, prev, next, seek } = playerStore

const offsetY = ref(0)
const startY = ref(0)
const isDragging = ref(false)

const backdropStyle = computed(() => {
  if (!currentSong.value?.cover) return {}
  return {
    backgroundImage: `url(${currentSong.value.cover})`
  }
})

const handleTouchStart = (e) => {
  startY.value = e.touches[0].clientY
  isDragging.value = true
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  const currentY = e.touches[0].clientY
  const diff = currentY - startY.value
  if (diff > 0) {
    offsetY.value = diff
  }
}

const handleTouchEnd = () => {
  isDragging.value = false
  if (offsetY.value > 100) {
    emit('close')
  }
  offsetY.value = 0
}

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
</script>

<style scoped>
.full-player {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-dark);
  z-index: 200;
  transition: transform 0.3s;
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
  padding: 24px;
}

.close-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  align-self: flex-start;
}

.cover-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.cover {
  width: 80vw;
  height: 80vw;
  max-width: 400px;
  max-height: 400px;
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
  font-size: 120px;
  color: var(--text-secondary);
}

.info {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.artist {
  font-size: 18px;
  color: var(--text-secondary);
}

.progress-section {
  margin-bottom: 40px;
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
  gap: 40px;
  padding-bottom: 40px;
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
</style>
