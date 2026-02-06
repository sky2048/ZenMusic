import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'

const API_BASE = 'https://music-crawler.sky70old.workers.dev'

export const usePlayerStore = defineStore('player', () => {
  // 状态
  const songs = ref([])
  const currentIndex = ref(0)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const audio = new Audio()
  const currentOnlineSong = ref(null) // 当前在线歌曲详情
  const lyrics = ref('') // 歌词
  const playMode = ref('order') // 播放模式: order(顺序), random(随机), single(单曲循环), loop(列表循环)
  const playlist = ref([]) // 当前播放列表

  // 计算属性
  const currentSong = computed(() => songs.value[currentIndex.value] || currentOnlineSong.value || null)
  const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)

  // 初始化音频事件
  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
    
    // 保存播放位置
    if (currentSong.value?.id) {
      localStorage.setItem('currentSongId', currentSong.value.id)
      localStorage.setItem('currentPosition', currentTime.value.toString())
    }
  })

  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })

  audio.addEventListener('ended', () => {
    if (playMode.value === 'single') {
      // 单曲循环：重新播放当前歌曲
      audio.currentTime = 0
      audio.play()
    } else {
      next()
    }
  })

  // 初始化：从 localStorage 加载播放模式和播放列表
  const savedMode = localStorage.getItem('playMode')
  if (savedMode) {
    playMode.value = savedMode
  }
  
  const savedPlaylist = localStorage.getItem('playlist')
  if (savedPlaylist) {
    try {
      playlist.value = JSON.parse(savedPlaylist)
    } catch (e) {
      console.error('加载播放列表失败:', e)
    }
  }

  // 恢复播放状态（歌曲ID和播放位置）
  const savedSongId = localStorage.getItem('currentSongId')
  const savedPosition = parseFloat(localStorage.getItem('currentPosition') || '0')
  
  if (savedSongId && savedPosition) {
    // 找到对应的歌曲
    const savedSong = playlist.value.find(s => s.id === savedSongId)
    if (savedSong) {
      currentOnlineSong.value = savedSong
      // 设置音频源但不自动播放
      audio.src = savedSong.musicUrl
      audio.currentTime = savedPosition
    }
  }

  // 加载所有歌曲
  async function loadSongs() {
    songs.value = await storage.getAllMeta()
  }

  // 导入本地文件
  async function importFile(file) {
    const id = Date.now().toString()
    const song = {
      id,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: '未知艺术家',
      cover: null,
      duration: 0
    }

    await storage.saveSong(id, file)
    await storage.saveMeta(song)
    await loadSongs()
  }

  // 播放在线歌曲（从榜单）
  async function playOnlineSong(songInfo) {
    try {
      console.log('开始获取歌曲详情:', songInfo.id)
      
      // 获取歌曲详情
      const response = await fetch(`${API_BASE}/api/song/${songInfo.id}`)
      const result = await response.json()
      
      console.log('歌曲详情返回:', result)
      
      if (result.success && result.data) {
        const songDetail = result.data
        
        console.log('音乐URL:', songDetail.musicUrl)
        
        const song = {
          id: songDetail.id,
          title: songDetail.title,
          name: songDetail.title,
          artist: songDetail.artist,
          cover: songDetail.cover,
          musicUrl: songDetail.musicUrl
        }
        
        currentOnlineSong.value = song
        lyrics.value = songDetail.lyrics || ''
        
        // 添加到播放列表
        addToPlaylist(song)
        
        // 播放音乐
        audio.src = songDetail.musicUrl
        
        audio.onerror = (e) => {
          console.error('音频加载错误:', e)
          console.error('音频URL:', audio.src)
          console.error('错误代码:', audio.error?.code)
          console.error('错误信息:', audio.error?.message)
        }
        
        audio.onloadeddata = () => {
          console.log('音频加载成功')
        }
        
        await audio.play()
        isPlaying.value = true
        console.log('开始播放')
        
        // 开始下载到本地
        downloadSongToLocal(song)
      }
    } catch (error) {
      console.error('播放在线歌曲失败:', error)
      throw error
    }
  }

  // 下载歌曲到本地
  async function downloadSongToLocal(song) {
    try {
      console.log('开始下载歌曲到本地:', song.title)
      
      // 检查是否已经下载
      const existingBlob = await storage.getSong(song.id)
      if (existingBlob) {
        console.log('歌曲已存在本地:', song.title)
        return
      }
      
      // 使用后端代理下载音频文件
      // 如果 musicUrl 是完整的 URL，需要通过后端代理
      let downloadUrl = song.musicUrl
      
      // 如果是外部 URL，需要通过后端获取代理 URL
      if (song.musicUrl && song.musicUrl.startsWith('http')) {
        // 重新获取歌曲详情，使用后端代理的 URL
        try {
          const response = await fetch(`${API_BASE}/api/song/${song.id}`)
          const result = await response.json()
          if (result.success && result.data && result.data.musicUrl) {
            downloadUrl = result.data.musicUrl
          }
        } catch (e) {
          console.error('获取代理 URL 失败:', e)
        }
      }
      
      console.log('下载 URL:', downloadUrl)
      
      // 下载音频文件
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }
      
      const blob = await response.blob()
      
      // 保存到本地
      await storage.saveSong(song.id, blob)
      
      // 保存元数据
      const meta = {
        id: song.id,
        title: song.title || song.name,
        artist: song.artist,
        cover: song.cover,
        duration: 0
      }
      await storage.saveMeta(meta)
      
      console.log('歌曲下载完成:', song.title)
    } catch (error) {
      console.error('下载歌曲失败:', error)
      // 下载失败不影响播放，只是下次还需要在线播放
    }
  }

  // 播放指定歌曲（本地）
  async function play(index) {
    if (index !== undefined) {
      currentIndex.value = index
    }

    const song = currentSong.value
    if (!song) return

    // 如果是本地歌曲
    if (song.id && !song.musicUrl) {
      const blob = await storage.getSong(song.id)
      if (blob) {
        audio.src = URL.createObjectURL(blob)
        audio.play()
        isPlaying.value = true
      }
    }
  }

  // 暂停
  function pause() {
    audio.pause()
    isPlaying.value = false
  }

  // 切换播放/暂停
  function toggle() {
    // 如果没有当前歌曲，且播放列表有歌曲，播放第一首
    if (!currentSong.value && playlist.value.length > 0) {
      playFromPlaylist(0)
      return
    }
    
    if (isPlaying.value) {
      pause()
    } else {
      if (currentOnlineSong.value && currentOnlineSong.value.musicUrl) {
        audio.play()
        isPlaying.value = true
      } else {
        play()
      }
    }
  }

  // 切换播放模式
  function togglePlayMode() {
    const modes = ['order', 'random', 'single', 'loop']
    const currentIndex = modes.indexOf(playMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    playMode.value = modes[nextIndex]
    
    // 保存到 localStorage
    localStorage.setItem('playMode', playMode.value)
    
    return playMode.value
  }

  // 添加到播放列表
  function addToPlaylist(song) {
    // 检查是否已存在
    const exists = playlist.value.find(s => s.id === song.id)
    if (!exists) {
      playlist.value.push(song)
      savePlaylist()
      
      // 如果这是播放列表中的第一首歌，且当前没有播放歌曲，自动设置为当前歌曲
      if (playlist.value.length === 1 && !currentOnlineSong.value) {
        currentOnlineSong.value = song
        lyrics.value = '' // 清空歌词，等播放时再加载
      }
      
      // 开始下载到本地
      if (song.musicUrl) {
        downloadSongToLocal(song)
      }
    }
  }

  // 从播放列表移除
  async function removeFromPlaylist(songId) {
    playlist.value = playlist.value.filter(s => s.id !== songId)
    savePlaylist()
    
    // 删除本地文件
    try {
      await storage.deleteSong(songId)
      console.log('已删除本地文件:', songId)
    } catch (error) {
      console.error('删除本地文件失败:', error)
    }
    
    // 如果删除的是当前播放的歌曲
    if (currentSong.value?.id === songId) {
      pause()
      audio.src = ''
      
      // 如果播放列表还有歌曲，播放第一首
      if (playlist.value.length > 0) {
        await playFromPlaylist(0)
      } else {
        // 播放列表为空，清空所有播放状态
        currentOnlineSong.value = null
        currentIndex.value = 0
        currentTime.value = 0
        duration.value = 0
        lyrics.value = ''
        isPlaying.value = false
        localStorage.removeItem('currentSongId')
        localStorage.removeItem('currentPosition')
      }
    } else if (playlist.value.length === 0) {
      // 即使删除的不是当前播放的歌曲，但播放列表已空，也要清空状态
      pause()
      audio.src = ''
      currentOnlineSong.value = null
      currentIndex.value = 0
      currentTime.value = 0
      duration.value = 0
      lyrics.value = ''
      isPlaying.value = false
      localStorage.removeItem('currentSongId')
      localStorage.removeItem('currentPosition')
    }
  }

  // 清空播放列表
  function clearPlaylist() {
    playlist.value = []
    savePlaylist()
  }

  // 保存播放列表到 localStorage
  function savePlaylist() {
    localStorage.setItem('playlist', JSON.stringify(playlist.value))
  }

  // 从播放列表播放指定歌曲
  async function playFromPlaylist(index) {
    const song = playlist.value[index]
    if (!song) return
    
    try {
      // 先检查本地是否有缓存
      const localBlob = await storage.getSong(song.id)
      
      if (localBlob) {
        // 使用本地文件播放
        console.log('从本地播放:', song.title)
        currentOnlineSong.value = song
        
        // 尝试获取歌词（如果有的话）
        try {
          const response = await fetch(`${API_BASE}/api/song/${song.id}`)
          const result = await response.json()
          if (result.success && result.data) {
            lyrics.value = result.data.lyrics || ''
          }
        } catch (e) {
          console.log('获取歌词失败，继续播放')
        }
        
        audio.src = URL.createObjectURL(localBlob)
        await audio.play()
        isPlaying.value = true
      } else if (song.musicUrl) {
        // 在线歌曲，需要重新获取详情
        await playOnlineSong(song)
      } else {
        // 本地歌曲
        currentIndex.value = songs.value.findIndex(s => s.id === song.id)
        if (currentIndex.value !== -1) {
          await play()
        }
      }
    } catch (error) {
      console.error('播放失败:', error)
    }
  }

  // 上一首
  function prev() {
    // 如果有播放列表，从播放列表中播放
    if (playlist.value.length > 0) {
      const currentPlaylistIndex = playlist.value.findIndex(s => s.id === currentSong.value?.id)
      
      if (playMode.value === 'random') {
        // 随机模式：随机选择一首
        const randomIndex = Math.floor(Math.random() * playlist.value.length)
        playFromPlaylist(randomIndex)
      } else if (currentPlaylistIndex > 0) {
        playFromPlaylist(currentPlaylistIndex - 1)
      } else if (playMode.value === 'loop') {
        // 列表循环：跳到最后一首
        playFromPlaylist(playlist.value.length - 1)
      }
    } else if (songs.value.length > 0) {
      // 没有播放列表，使用本地歌曲
      if (playMode.value === 'random') {
        const randomIndex = Math.floor(Math.random() * songs.value.length)
        play(randomIndex)
      } else if (currentIndex.value > 0) {
        play(currentIndex.value - 1)
      } else if (playMode.value === 'loop') {
        play(songs.value.length - 1)
      }
    }
  }

  // 下一首
  function next() {
    // 如果有播放列表，从播放列表中播放
    if (playlist.value.length > 0) {
      const currentPlaylistIndex = playlist.value.findIndex(s => s.id === currentSong.value?.id)
      
      if (playMode.value === 'random') {
        // 随机模式：随机选择一首
        const randomIndex = Math.floor(Math.random() * playlist.value.length)
        playFromPlaylist(randomIndex)
      } else if (currentPlaylistIndex < playlist.value.length - 1) {
        playFromPlaylist(currentPlaylistIndex + 1)
      } else if (playMode.value === 'loop') {
        // 列表循环：跳到第一首
        playFromPlaylist(0)
      } else {
        pause()
      }
    } else if (songs.value.length > 0) {
      // 没有播放列表，使用本地歌曲
      if (playMode.value === 'random') {
        const randomIndex = Math.floor(Math.random() * songs.value.length)
        play(randomIndex)
      } else if (currentIndex.value < songs.value.length - 1) {
        play(currentIndex.value + 1)
      } else if (playMode.value === 'loop') {
        play(0)
      } else {
        pause()
      }
    }
  }

  // 跳转到指定时间
  function seek(percent) {
    if (duration.value) {
      audio.currentTime = (percent / 100) * duration.value
    }
  }

  // 删除歌曲
  async function deleteSong(id) {
    await storage.deleteSong(id)
    await loadSongs()
    if (currentSong.value?.id === id) {
      pause()
      currentIndex.value = 0
    }
  }

  return {
    songs,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    progress,
    lyrics,
    currentOnlineSong,
    playMode,
    playlist,
    loadSongs,
    importFile,
    play,
    playOnlineSong,
    pause,
    toggle,
    prev,
    next,
    seek,
    deleteSong,
    togglePlayMode,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    playFromPlaylist,
    downloadSongToLocal
  }
})
