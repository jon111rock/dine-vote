<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { leaveRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

const roomId = ref('')
const isLoading = ref(false)

onMounted(() => {
  const urlRoomId = route.query.roomId
  if (urlRoomId) {
    roomId.value = urlRoomId
  }
})

const handleLeaveRoom = async () => {
  if (!roomId.value || !nicknameStorage.hasNickname()) {
    router.push('/')
    return
  }

  try {
    isLoading.value = true
    const userId = nicknameStorage.nickname.value
    await leaveRoom(roomId.value, userId)
    toast.success('已離開房間')
    router.push('/')
  } catch (err) {
    console.error('離開房間失敗:', err)
    toast.error(err.message || '離開房間失敗')
  } finally {
    isLoading.value = false
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
          <span class="text-xs text-indigo-800 cursor-pointer bg-indigo-100 px-2 py-1 rounded-lg">房間代碼：{{ roomId }}</span>
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