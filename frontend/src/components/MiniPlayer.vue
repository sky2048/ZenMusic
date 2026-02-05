<template>
  <div class="mini-player" @click="$emit('click')">
    <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    
    <div class="content">
      <div class="info">
        <div class="title">{{ currentSong?.title }}</div>
        <div class="artist">{{ currentSong?.artist }}</div>
      </div>

      <button class="play-btn" @click.stop="toggle">
        <span v-if="isPlaying">❚❚</span>
        <span v-else>▶</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { usePlayerStore } from '../stores/player'

defineEmits(['click'])

const playerStore = usePlayerStore()
const { currentSong, isPlaying, progress } = storeToRefs(playerStore)
const { toggle } = playerStore
</script>

<style scoped>
.mini-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: transparent;
  cursor: pointer;
  z-index: 100;
  pointer-events: none;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--primary);
  transition: width 0.3s;
  pointer-events: auto;
}

.content {
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-gray);
  pointer-events: auto;
}

.info {
  flex: 1;
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

.play-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform 0.2s;
}

.play-btn:active {
  transform: scale(0.9);
}
</style>
