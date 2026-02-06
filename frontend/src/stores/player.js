import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storage } from '../utils/storage'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import { CapacitorHttp } from '@capacitor/core'

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
    console.log('音频元数据已加载, duration:', audio.duration, 'isNaN:', isNaN(audio.duration), 'duration.value:', duration.value)
  })

  audio.addEventListener('loadeddata', () => {
    console.log('音频数据已加载, duration:', audio.duration, 'duration.value:', duration.value)
    if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      duration.value = audio.duration
      console.log('更新 duration.value 为:', duration.value)
    }
  })

  audio.addEventListener('canplay', () => {
    console.log('音频可以播放, duration:', audio.duration, 'duration.value:', duration.value)
    if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      duration.value = audio.duration
      console.log('更新 duration.value 为:', duration.value)
    }
  })

  audio.addEventListener('durationchange', () => {
    console.log('音频时长变化, duration:', audio.duration, 'duration.value:', duration.value)
    if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
      duration.value = audio.duration
      console.log('更新 duration.value 为:', duration.value)
    }
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
  
  audio.addEventListener('error', (e) => {
    console.error('音频加载错误:', e)
    console.error('错误代码:', audio.error?.code)
    console.error('错误信息:', audio.error?.message)
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
        
        // 开始下载到本地（后台进行）
        downloadSongToLocal(song)
      }
    } catch (error) {
      console.error('播放在线歌曲失败:', error)
      throw error
    }
  }

  // 下载歌曲到本地（使用 Capacitor Filesystem API）
  async function downloadSongToLocal(song) {
    try {
      console.log('开始下载歌曲到本地:', song.title)
      
      // 检查是否已经下载
      const existingBlob = await storage.getSong(song.id)
      if (existingBlob) {
        console.log('歌曲已存在本地:', song.title)
        return
      }
      
      // 检查是否在原生环境（Android/iOS）
      const isNative = Capacitor.isNativePlatform()
      
      if (isNative) {
        // 使用 Capacitor HTTP 插件下载（绕过 CORS）
        console.log('使用 Capacitor HTTP 下载')
        
        // 使用 Capacitor HTTP 插件下载文件（返回 base64）
        const response = await CapacitorHttp.get({
          url: song.musicUrl,
          responseType: 'arraybuffer'
        })
        
        if (response.status !== 200) {
          throw new Error(`下载失败: ${response.status}`)
        }
        
        console.log('下载成功，开始保存文件')
        
        // response.data 是 base64 字符串
        const base64Data = response.data
        
        // 保存到文件系统
        const fileName = `${song.id}.mp3`
        await Filesystem.writeFile({
          path: `music/${fileName}`,
          data: base64Data,
          directory: Directory.Data,
          recursive: true
        })
        
        console.log('文件已保存到 Capacitor Filesystem:', fileName)
        
        // 将 base64 转换为 blob 保存到 IndexedDB
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        
        await storage.saveSong(song.id, blob)
        
        // 保存元数据
        const meta = {
          id: song.id,
          title: song.title || song.name,
          artist: song.artist,
          cover: song.cover,
          duration: 0,
          localPath: `music/${fileName}`
        }
        await storage.saveMeta(meta)
        
        console.log('歌曲下载完成:', song.title)
        
        // 更新播放列表中的歌曲信息，添加 localPath
        const playlistIndex = playlist.value.findIndex(s => s.id === song.id)
        if (playlistIndex !== -1) {
          playlist.value[playlistIndex] = {
            ...playlist.value[playlistIndex],
            localPath: `music/${fileName}`
          }
          savePlaylist()
        }
        
        // 如果当前正在播放这首歌，且是在线播放，切换到本地文件
        if (currentOnlineSong.value?.id === song.id && audio.src === song.musicUrl) {
          console.log('切换到本地文件播放:', song.title)
          
          // 记录当前播放位置
          const currentPosition = audio.currentTime
          const wasPlaying = isPlaying.value
          
          // 暂停当前播放
          if (wasPlaying) {
            audio.pause()
          }
          
          // 读取本地文件
          try {
            const fileData = await Filesystem.readFile({
              path: `music/${fileName}`,
              directory: Directory.Data
            })
            
            // 转换为 Blob
            const base64Data = fileData.data
            const binaryString = atob(base64Data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' })
            const blobUrl = URL.createObjectURL(blob)
            
            // 设置新的音频源
            audio.src = blobUrl
            audio.currentTime = currentPosition
            
            // 如果之前在播放，继续播放
            if (wasPlaying) {
              await audio.play()
            }
            
            console.log('已切换到本地文件，继续播放')
          } catch (error) {
            console.error('切换到本地文件失败:', error)
            // 切换失败，继续使用在线播放
            if (wasPlaying) {
              audio.play()
            }
          }
        }
        
      } else {
        // 浏览器环境，使用 IndexedDB（但会受 CORS 限制）
        console.log('浏览器环境，尝试下载（可能受 CORS 限制）')
        
        try {
          const response = await fetch(song.musicUrl, {
            mode: 'no-cors'
          })
          
          if (response.type === 'opaque') {
            console.log('收到 opaque 响应，无法保存（CORS 限制）')
            return
          }
          
          const blob = await response.blob()
          await storage.saveSong(song.id, blob)
          
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
          console.error('浏览器环境下载失败（CORS 限制）:', error)
        }
      }
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
        
        // 预加载音频（不自动播放）
        if (song.musicUrl) {
          audio.src = song.musicUrl
          
          // 监听元数据加载，更新 duration
          const onLoadedMetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
              console.log('第一首歌预加载完成, duration:', duration.value)
            }
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
          }
          
          const onCanPlay = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
              console.log('第一首歌可以播放, duration:', duration.value)
            }
            audio.removeEventListener('canplay', onCanPlay)
          }
          
          const onDurationChange = () => {
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
              console.log('第一首歌时长更新, duration:', duration.value)
            }
          }
          
          audio.addEventListener('loadedmetadata', onLoadedMetadata)
          audio.addEventListener('canplay', onCanPlay)
          audio.addEventListener('durationchange', onDurationChange)
          
          // 加载音频元数据（但不播放）
          audio.load()
        }
      }
      
      // 后台下载到本地（使用 Capacitor Filesystem API）
      if (song.musicUrl) {
        downloadSongToLocal(song)
      }
    }
  }

  // 从播放列表移除
  async function removeFromPlaylist(songId) {
    playlist.value = playlist.value.filter(s => s.id !== songId)
    savePlaylist()
    
    // 注释掉删除本地文件的逻辑，因为我们不再下载文件
    // try {
    //   await storage.deleteSong(songId)
    //   console.log('已删除本地文件:', songId)
    // } catch (error) {
    //   console.error('删除本地文件失败:', error)
    // }
    
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
      // 先暂停当前播放
      if (isPlaying.value) {
        audio.pause()
        isPlaying.value = false
      }
      
      // 检查是否在原生环境
      const isNative = Capacitor.isNativePlatform()
      
      // 先检查本地是否有缓存
      let hasLocalFile = false
      
      if (isNative && song.localPath) {
        // 在原生环境下，检查 Filesystem 中是否有文件
        try {
          await Filesystem.stat({
            path: song.localPath,
            directory: Directory.Data
          })
          hasLocalFile = true
          console.log('找到本地文件:', song.localPath)
        } catch (e) {
          console.log('本地文件不存在:', song.localPath)
          hasLocalFile = false
        }
      }
      
      if (isNative && hasLocalFile) {
        // 在原生环境下从 Filesystem 读取并播放
        console.log('从 Capacitor Filesystem 播放:', song.title)
        currentOnlineSong.value = song
        
        try {
          // 读取文件内容（base64）
          const fileData = await Filesystem.readFile({
            path: song.localPath,
            directory: Directory.Data
          })
          
          console.log('文件读取成功，转换为 Blob')
          
          // 将 base64 转换为 Blob
          const base64Data = fileData.data
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' })
          
          // 创建 Blob URL
          const blobUrl = URL.createObjectURL(blob)
          console.log('创建 blob URL:', blobUrl)
          audio.src = blobUrl
          
          // 重置时长
          currentTime.value = 0
          duration.value = 0
          
          // 等待音频元数据加载并播放
          const playPromise = new Promise((resolve, reject) => {
            let metadataLoaded = false
            let timeoutId = null
            
            const onLoadedMetadata = () => {
              console.log('loadedmetadata 触发, duration:', audio.duration)
              metadataLoaded = true
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                duration.value = audio.duration
              }
              cleanup()
              startPlayback(resolve, reject)
            }
            
            const onCanPlay = () => {
              console.log('canplay 触发, duration:', audio.duration)
              if (!metadataLoaded) {
                if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                  duration.value = audio.duration
                }
                cleanup()
                startPlayback(resolve, reject)
              }
            }
            
            const onDurationChange = () => {
              console.log('durationchange 触发, duration:', audio.duration)
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                duration.value = audio.duration
              }
            }
            
            const onError = (e) => {
              console.error('音频加载错误:', e)
              cleanup()
              reject(e)
            }
            
            const cleanup = () => {
              if (timeoutId) clearTimeout(timeoutId)
              audio.removeEventListener('loadedmetadata', onLoadedMetadata)
              audio.removeEventListener('canplay', onCanPlay)
              audio.removeEventListener('durationchange', onDurationChange)
              audio.removeEventListener('error', onError)
            }
            
            const startPlayback = (resolve, reject) => {
              audio.play()
                .then(() => {
                  isPlaying.value = true
                  console.log('本地文件播放成功, duration:', duration.value)
                  resolve()
                })
                .catch(err => {
                  console.error('播放失败:', err)
                  reject(err)
                })
            }
            
            audio.addEventListener('loadedmetadata', onLoadedMetadata)
            audio.addEventListener('canplay', onCanPlay)
            audio.addEventListener('durationchange', onDurationChange)
            audio.addEventListener('error', onError)
            
            // 设置超时，如果 5 秒内没有加载完成，尝试播放
            timeoutId = setTimeout(() => {
              console.log('加载超时，尝试播放')
              if (!metadataLoaded) {
                cleanup()
                startPlayback(resolve, reject)
              }
            }, 5000)
            
            // 加载音频
            audio.load()
          })
          
          // 后台异步获取歌词（不阻塞播放）
          fetch(`${API_BASE}/api/song/${song.id}`, {
            signal: AbortSignal.timeout(5000) // 5秒超时
          })
            .then(response => response.json())
            .then(result => {
              if (result.success && result.data) {
                lyrics.value = result.data.lyrics || ''
                console.log('歌词加载成功')
              }
            })
            .catch(e => {
              console.log('获取歌词失败（不影响播放）:', e.message)
              lyrics.value = ''
            })
          
          return playPromise
          
        } catch (error) {
          console.error('从 Filesystem 读取文件失败:', error)
          // 如果读取失败，尝试在线播放
          if (song.musicUrl) {
            console.log('回退到在线播放')
          } else {
            throw error
          }
        }
      } else if (isNative && song.localPath && !hasLocalFile && song.musicUrl) {
        // 本地文件不存在但有 musicUrl，重新下载
        console.log('本地文件不存在，重新下载:', song.title)
        
        // 先在线播放
        currentOnlineSong.value = song
        audio.src = song.musicUrl
        currentTime.value = 0
        duration.value = 0
        
        const playPromise = new Promise((resolve, reject) => {
          let metadataLoaded = false
          let timeoutId = null
          
          const onLoadedMetadata = () => {
            console.log('loadedmetadata 触发, duration:', audio.duration)
            metadataLoaded = true
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
            }
            cleanup()
            startPlayback(resolve, reject)
          }
          
          const onCanPlay = () => {
            console.log('canplay 触发, duration:', audio.duration)
            if (!metadataLoaded) {
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                duration.value = audio.duration
              }
              cleanup()
              startPlayback(resolve, reject)
            }
          }
          
          const onDurationChange = () => {
            console.log('durationchange 触发, duration:', audio.duration)
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
            }
          }
          
          const onError = (e) => {
            console.error('音频加载错误:', e)
            cleanup()
            reject(e)
          }
          
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId)
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('durationchange', onDurationChange)
            audio.removeEventListener('error', onError)
          }
          
          const startPlayback = (resolve, reject) => {
            audio.play()
              .then(() => {
                isPlaying.value = true
                console.log('在线播放成功, duration:', duration.value)
                resolve()
              })
              .catch(err => {
                console.error('播放失败:', err)
                reject(err)
              })
          }
          
          audio.addEventListener('loadedmetadata', onLoadedMetadata)
          audio.addEventListener('canplay', onCanPlay)
          audio.addEventListener('durationchange', onDurationChange)
          audio.addEventListener('error', onError)
          
          timeoutId = setTimeout(() => {
            console.log('加载超时，尝试播放')
            if (!metadataLoaded) {
              cleanup()
              startPlayback(resolve, reject)
            }
          }, 5000)
          
          audio.load()
        })
        
        // 后台重新下载
        playPromise.then(() => {
          console.log('开始后台重新下载')
          downloadSongToLocal(song)
        })
        
        // 后台异步获取歌词
        fetch(`${API_BASE}/api/song/${song.id}`, {
          signal: AbortSignal.timeout(5000)
        })
          .then(response => response.json())
          .then(result => {
            if (result.success && result.data) {
              lyrics.value = result.data.lyrics || ''
              console.log('歌词加载成功')
            }
          })
          .catch(e => {
            console.log('获取歌词失败（不影响播放）:', e.message)
            lyrics.value = ''
          })
        
        return playPromise
      }
      
      // 尝试从 IndexedDB 读取（浏览器环境或没有 localPath）
      const localBlob = await storage.getSong(song.id)
      
      if (localBlob) {
        // 使用本地缓存播放
        console.log('从 IndexedDB 缓存播放:', song.title)
        currentOnlineSong.value = song
        
        // 设置音频源
        const blobUrl = URL.createObjectURL(localBlob)
        console.log('创建 blob URL:', blobUrl)
        audio.src = blobUrl
        
        // 重置时长
        currentTime.value = 0
        duration.value = 0
        
        // 等待音频元数据加载并播放
        const playPromise = new Promise((resolve, reject) => {
          const onLoadedMetadata = () => {
            console.log('loadedmetadata 触发, duration:', audio.duration)
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
            }
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('error', onError)
            
            // 尝试播放
            audio.play()
              .then(() => {
                isPlaying.value = true
                console.log('本地缓存播放成功, duration:', duration.value)
                resolve()
              })
              .catch(err => {
                console.error('播放失败:', err)
                reject(err)
              })
          }
          
          const onError = (e) => {
            console.error('音频加载错误:', e)
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('error', onError)
            reject(e)
          }
          
          audio.addEventListener('loadedmetadata', onLoadedMetadata)
          audio.addEventListener('error', onError)
          
          // 加载音频
          audio.load()
        })
        
        // 后台异步获取歌词（不阻塞播放）
        fetch(`${API_BASE}/api/song/${song.id}`, {
          signal: AbortSignal.timeout(5000) // 5秒超时
        })
          .then(response => response.json())
          .then(result => {
            if (result.success && result.data) {
              lyrics.value = result.data.lyrics || ''
              console.log('歌词加载成功')
            }
          })
          .catch(e => {
            console.log('获取歌词失败（不影响播放）:', e.message)
            lyrics.value = ''
          })
        
        return playPromise
        
      } else if (song.musicUrl) {
        // 没有本地缓存，在线播放
        console.log('从在线播放:', song.title)
        currentOnlineSong.value = song
        
        // 设置音频源
        audio.src = song.musicUrl
        
        // 重置时长
        currentTime.value = 0
        duration.value = 0
        
        // 等待音频元数据加载并播放
        const playPromise = new Promise((resolve, reject) => {
          let metadataLoaded = false
          let timeoutId = null
          
          const onLoadedMetadata = () => {
            console.log('loadedmetadata 触发, duration:', audio.duration)
            metadataLoaded = true
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
            }
            cleanup()
            startPlayback(resolve, reject)
          }
          
          const onCanPlay = () => {
            console.log('canplay 触发, duration:', audio.duration)
            if (!metadataLoaded) {
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                duration.value = audio.duration
              }
              cleanup()
              startPlayback(resolve, reject)
            }
          }
          
          const onDurationChange = () => {
            console.log('durationchange 触发, duration:', audio.duration)
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
              duration.value = audio.duration
            }
          }
          
          const onError = (e) => {
            console.error('音频加载错误:', e)
            cleanup()
            reject(e)
          }
          
          const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId)
            audio.removeEventListener('loadedmetadata', onLoadedMetadata)
            audio.removeEventListener('canplay', onCanPlay)
            audio.removeEventListener('durationchange', onDurationChange)
            audio.removeEventListener('error', onError)
          }
          
          const startPlayback = (resolve, reject) => {
            audio.play()
              .then(() => {
                isPlaying.value = true
                console.log('在线播放成功, duration:', duration.value)
                resolve()
              })
              .catch(err => {
                console.error('播放失败:', err)
                reject(err)
              })
          }
          
          audio.addEventListener('loadedmetadata', onLoadedMetadata)
          audio.addEventListener('canplay', onCanPlay)
          audio.addEventListener('durationchange', onDurationChange)
          audio.addEventListener('error', onError)
          
          // 设置超时，如果 5 秒内没有加载完成，尝试播放
          timeoutId = setTimeout(() => {
            console.log('加载超时，尝试播放')
            if (!metadataLoaded) {
              cleanup()
              startPlayback(resolve, reject)
            }
          }, 5000)
          
          // 加载音频
          audio.load()
        })
        
        // 后台异步获取歌词（不阻塞播放）
        fetch(`${API_BASE}/api/song/${song.id}`, {
          signal: AbortSignal.timeout(5000) // 5秒超时
        })
          .then(response => response.json())
          .then(result => {
            if (result.success && result.data) {
              lyrics.value = result.data.lyrics || ''
              console.log('歌词加载成功')
            }
          })
          .catch(e => {
            console.log('获取歌词失败（不影响播放）:', e.message)
            lyrics.value = ''
          })
        
        // 后台下载到本地
        playPromise.then(() => {
          downloadSongToLocal(song)
        })
        
        return playPromise
        
      } else {
        // 本地歌曲（用户导入的）
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
