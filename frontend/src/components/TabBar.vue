<template>
  <div class="tab-bar">
    <button 
      v-for="tab in tabs" 
      :key="tab.name"
      class="tab-item"
      :class="{ active: currentTab === tab.name }"
      @click="$emit('change', tab.name)"
    >
      <span class="icon">{{ tab.icon }}</span>
      <span class="label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentTab: String
})

defineEmits(['change'])

const tabs = [
  { name: 'home', icon: '♪', label: '主页' },
  { name: 'player', icon: '▶', label: '播放' },
  { name: 'settings', icon: '⚙', label: '设置' }
]
</script>

<style scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-gray);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  transition: all 0.2s;
}

.icon {
  font-size: 24px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.label {
  font-size: 12px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tab-item.active .icon,
.tab-item.active .label {
  color: var(--primary);
}

.tab-item:active {
  transform: scale(0.95);
}
</style>
