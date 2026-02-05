import localforage from 'localforage'

// 配置 IndexedDB 存储
const musicDB = localforage.createInstance({
  name: 'ZenMusic',
  storeName: 'songs',
  description: '本地音乐数据库'
})

const metaDB = localforage.createInstance({
  name: 'ZenMusic',
  storeName: 'metadata',
  description: '歌曲元数据'
})

export const storage = {
  // 保存歌曲文件（二进制数据）
  async saveSong(id, audioBlob) {
    await musicDB.setItem(id, audioBlob)
  },

  // 获取歌曲文件
  async getSong(id) {
    return await musicDB.getItem(id)
  },

  // 保存歌曲元数据
  async saveMeta(song) {
    const songs = await this.getAllMeta()
    songs.push(song)
    await metaDB.setItem('songList', songs)
  },

  // 获取所有歌曲元数据
  async getAllMeta() {
    const songs = await metaDB.getItem('songList')
    return songs || []
  },

  // 删除歌曲
  async deleteSong(id) {
    await musicDB.removeItem(id)
    const songs = await this.getAllMeta()
    const filtered = songs.filter(s => s.id !== id)
    await metaDB.setItem('songList', filtered)
  },

  // 清空所有数据
  async clearAll() {
    await musicDB.clear()
    await metaDB.clear()
  }
}
