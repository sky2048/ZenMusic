<template>
  <div 
    class="song-item"
    :class="{ active: isActive }"
    @click="$emit('click')"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="{ transform: `translateX(${offsetX}px)` }"
  >
    <div class="cover">
      <img v-if="song.cover" :src="song.cover" alt="" />
      <div v-else class="cover-placeholder">♪</div>
    </div>
    
    <div class="info">
      <div class="title">{{ song.title }}</div>
      <div class="artist">{{ song.artist }}</div>
    </div>

    <div class="delete-zone" @click.stop="handleDelete">
      <span>删除</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  song: Object,
  isActive: Boolean
})

const emit = defineEmits(['click', 'delete'])

const offsetX = ref(0)
const startX = ref(0)
const isSwiping = ref(false)

const handleTouchStart = (e) => {
  startX.value = e.touches[0].clientX
  isSwiping.value = true
}

const handleTouchMove = (e) => {
  if (!isSwiping.value) return
  const currentX = e.touches[0].clientX
  const diff = currentX - startX.value
  if (diff < 0 && diff > -100) {
    offsetX.value = diff
  }
}

const handleTouchEnd = () => {
  isSwiping.value = false
  if (offsetX.value < -50) {
    offsetX.value = -80
  } else {
    offsetX.value = 0
  }
}

const handleDelete = () => {
  emit('delete')
  offsetX.value = 0
}
</script>

<style scoped>
.song-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  position: relative;
  transition: transform 0.3s;
  cursor: pointer;
}

.song-item.active .title {
  color: var(--primary);
}

.cover {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-gray);
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
  font-size: 24px;
  color: var(--text-secondary);
}

.info {
  flex: 1;
  margin-left: 16px;
  overflow: hidden;
}

.title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-zone {
  position: absolute;
  right: -80px;
  top: 0;
  bottom: 0;
  width: 80px;
  background: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
}
</style>
