import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRoomStore = defineStore('room', () => {
  const roomStore = ref(null)

  /**
   * 設置房間資訊
   * @param {Object} roomInfo - 房間資訊
   * @param {string} roomInfo.roomName - 房間名稱
   * @param {string} roomInfo.roomId - 房間ID
   * @param {string} roomInfo.roomOwner - 房間擁有者
   */
  const setRoomStore = ({roomName, roomId, roomOwner}) => {
    roomStore.value = {
      roomName,
      roomId,
      roomOwner
    }
  }

  return {
    roomStore,
    setRoomStore
  }
})