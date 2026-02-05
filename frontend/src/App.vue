<template>
  <div class="app">
    <div class="page-container">
      <Home 
        v-show="currentTab === 'home' && !showSearch" 
        @switchTab="handleTabChange" 
        @openSearch="showSearch = true"
      />
      <Search 
        v-if="showSearch" 
        @back="showSearch = false"
        @playSong="handlePlaySong"
      />
      <Player v-show="currentTab === 'player' && !showSearch" @switchTab="handleTabChange" />
      <Settings v-show="currentTab === 'settings' && !showSearch" />
    </div>
    <TabBar v-show="!showSearch" :currentTab="currentTab" @change="handleTabChange" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Home from './views/Home.vue'
import Player from './views/Player.vue'
import Settings from './views/Settings.vue'
import Search from './views/Search.vue'
import TabBar from './components/TabBar.vue'

const currentTab = ref('home')
const showSearch = ref(false)

const handleTabChange = (tab) => {
  currentTab.value = tab
  showSearch.value = false
}

const handlePlaySong = () => {
  currentTab.value = 'player'
  showSearch.value = false
}
</script>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.page-container {
  width: 100%;
  height: calc(100vh - 64px);
  overflow: hidden;
}
</style>
