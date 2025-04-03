<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { leaveRoom, getRoomById, watchRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

const roomId = ref('')
const roomCode = ref('')
const isLoading = ref(false)
const isOwner = ref(false)
const unsubscribe = ref(null)

onMounted(async () => {
  const urlRoomId = route.query.roomId
  if (urlRoomId) {
    roomId.value = urlRoomId
    try {
      const room = await getRoomById(urlRoomId)
      if (room) {
        roomCode.value = room.roomCode
        isOwner.value = room.ownerId === nicknameStorage.nickname.value

        // 監聽房間狀態
        unsubscribe.value = watchRoom(urlRoomId, (room) => {
          if (!room) {
            // 房間被刪除
            toast.success('房主已離開房間')
            // 延遲跳轉，讓使用者看到提示訊息
            setTimeout(() => {
              router.push('/')
            }, 1500)
            return
          }

          // 更新房間資訊
          roomCode.value = room.roomCode
          isOwner.value = room.ownerId === nicknameStorage.nickname.value
        })
      }
    } catch (err) {
      console.error('獲取房間資訊失敗:', err)
      toast.error('獲取房間資訊失敗')
      router.push('/')
    }
  }
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

const handleLeaveRoom = async () => {
  if (!roomId.value || !nicknameStorage.nickname.value) {
    toast.error('系統錯誤')
    return
  }

  try {
    isLoading.value = true
    await leaveRoom(roomId.value, nicknameStorage.nickname.value)
    toast.success('已離開房間')
    router.push('/')
  } catch (err) {
    console.error('離開房間失敗:', err)
    toast.error('離開房間失敗')
  } finally {
    isLoading.value = false
  }
}

// 複製房間代碼
const copyRoomCode = async () => {
  if (!roomCode.value) return

  try {
    await navigator.clipboard.writeText(roomCode.value)
    toast.success('複製成功')
  } catch (err) {
    console.error('複製失敗:', err)
    toast.error('複製失敗')
  }
}
</script>

<template>
  <div class="flex items-center h-screen flex-col">
    <div class="w-full max-w-md">
      <NavigationBack text="離開房間" :is-custom-action="true" @custom-action="handleLeaveRoom" />
      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">等待其他玩家加入</h1>
          <div class="flex items-center gap-2">
            <span v-if="isOwner" class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">房主</span>
            <span @click="copyRoomCode" class="text-xs text-indigo-800 cursor-pointer bg-indigo-100 px-2 py-1 rounded-lg hover:bg-indigo-200 transition-colors">
              房間代碼：{{ roomCode }}
            </span>
          </div>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-800">已加入成員(2/3)</span>
        </div>
        <div class="grid grid-cols-4 gap-3 mt-4">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold mx-auto mb-1 joined-animation">小</div>
            <p class="text-sm text-gray-800">小明</p>
          </div>
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg font-bold mx-auto mb-1 joined-animation">美</div>
            <p class="text-sm text-gray-800">美美</p>
          </div>
        </div>
        <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-8">開始投票</button>
      </div>
    </div>
  </div>
</template>