<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { getRoomByCode, joinRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

const roomCode = ref('')
const isLoading = ref(false)

// 如果有 URL 參數，自動填入房間代碼
onMounted(() => {
  const urlRoomCode = route.query.code
  if (urlRoomCode) {
    roomCode.value = urlRoomCode
  }
})

// 驗證房間是否存在
const validateRoom = async () => {
  if (!roomCode.value.trim()) {
    toast.error('請輸入房間代碼')
    return false
  }

  try {
    const room = await getRoomByCode(roomCode.value.trim().toUpperCase())
    if (!room) {
      toast.error('找不到此房間')
      return false
    }
    if (room.status !== 'active') {
      toast.error('此房間已結束')
      return false
    }
    return room
  } catch (err) {
    console.error('驗證房間失敗:', err)
    toast.error('驗證房間失敗')
    return false
  }
}

// 處理加入房間
const handleJoinRoom = async () => {
  if (!nicknameStorage.hasNickname()) {
    toast.error('請先設定暱稱')
    return
  }

  try {
    isLoading.value = true

    // 驗證房間
    const room = await validateRoom()
    if (!room) {
      return
    }

    // 加入房間
    const userId = nicknameStorage.nickname.value
    await joinRoom(room.id, userId)
    toast.success('加入房間成功')

    // 跳轉到等待房間
    router.push(`/waiting-room?roomId=${room.id}`)
  } catch (err) {
    console.error('加入房間失敗:', err)
    toast.error(err.message || '加入房間失敗')
  } finally {
    isLoading.value = false
  }
}

// 處理輸入變化
const handleInput = (e) => {
  // 只允許輸入字母和數字
  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '')
  roomCode.value = value.toUpperCase()
}

// 處理按鍵事件
const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    handleJoinRoom()
  }
}
</script>

<template>
  <div class="flex items-center min-h-screen flex-col w-full py-8 px-4">
    <div class="w-full max-w-md">
      <NavigationBack />
      <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <h1 class="text-2xl font-bold text-center text-gray-800">加入房間</h1>

        <div class="mt-6">
          <p class="text-sm font-medium text-gray-600">房間代碼</p>
          <div class="relative mt-2">
            <input v-model="roomCode" @input="handleInput" @keydown="handleKeydown" class="text-center text-lg w-full border border-gray-300 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase tracking-widest" type="text" placeholder="請輸入6碼房間代碼" :disabled="isLoading" maxlength="6" />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {{ roomCode.length }}/6
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button @click="handleJoinRoom" :disabled="isLoading || roomCode.length !== 6" class="cursor-pointer w-full bg-red-gradient text-white font-medium py-3 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {{ isLoading ? '處理中...' : '加入房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
