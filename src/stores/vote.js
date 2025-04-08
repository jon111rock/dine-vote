import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVoteStore = defineStore('vote',() => {
  // 狀態
  const roomId = ref('')

  // 動作
  const setRoomId = (id) => {
    roomId.value = id
  }

  return {
    roomId,
    setRoomId,
  }
})
