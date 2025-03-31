<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { getRoomById, joinRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

const roomId = ref('')
const isLoading = ref(false)

// 如果有 URL 參數，自動填入房間代碼
onMounted(() => {
  const urlRoomId = route.query.roomId
  if (urlRoomId) {
    roomId.value = urlRoomId
  }
})

// 驗證房間是否存在
const validateRoom = async () => {
  if (!roomId.value.trim()) {
    toast.error('請輸入房間代碼')
    return false
  }

  try {
    const room = await getRoomById(roomId.value.trim())
    if (!room) {
      toast.error('找不到此房間')
      return false
    }
    if (room.status !== 'active') {
      toast.error('此房間已結束')
      return false
    }
    return true
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
    const isValid = await validateRoom()
    if (!isValid) {
      return
    }

    // 加入房間
    const userId = nicknameStorage.nickname.value
    await joinRoom(roomId.value.trim(), userId)

    // 跳轉到等待房間
    router.push(`/waiting-room?roomId=${roomId.value.trim()}`)
  } catch (err) {
    console.error('加入房間失敗:', err)
    toast.error(err.message || '加入房間失敗')
  } finally {
    isLoading.value = false
  }
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
          <input v-model="roomId" @keydown="handleKeydown" class="text-center text-lg mt-2 w-full border border-gray-300 rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" type="text" placeholder="請輸入房間代碼" :disabled="isLoading" />
        </div>

        <div class="mt-6">
          <button @click="handleJoinRoom" :disabled="isLoading" class="cursor-pointer w-full bg-red-gradient text-white font-medium py-3 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {{ isLoading ? '處理中...' : '加入房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
