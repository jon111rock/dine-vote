<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { createRoom } from '@/firebase/rooms'
import { useToast } from '@/composables/useToast'

const toast = useToast()
const router = useRouter()
const roomName = ref('')
const location = ref('')
const expiryTime = ref('30')
const isAnonymous = ref(false)
const isLoading = ref(false)

const handleCreateRoom = async () => {
  if (!roomName.value.trim()) {
    toast.error('請輸入房間名稱')
    return
  }

  try {
    isLoading.value = true
    const roomData = {
      name: roomName.value,
      location: location.value,
      expiryTime: parseInt(expiryTime.value),
      isAnonymous: isAnonymous.value,
      createdBy: 'test-user' // 暫時使用測試用戶ID
    }

    const newRoom = await createRoom(roomData)
    console.log('房間創建成功:', newRoom)
    toast.success('房間創建成功')
    router.push(`/waiting-room?roomId=${newRoom.id}`)
  } catch (error) {
    console.error('創建房間失敗:', error)
    toast.error('創建房間失敗，請稍後再試')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center min-h-screen flex-col w-full py-8 px-4">
    <div class="w-full max-w-md">
      <NavigationBack backPath="/" />
      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <div>
          <p class="text-2xl font-bold text-gray-700">創建房間</p>
        </div>
        <div class="mt-6">
          <p class="text-sm">房間名稱</p>
          <input v-model="roomName" type="text" class="w-full mt-2 border border-gray-300 rounded-lg p-3" placeholder="例如： 晚餐吃什麼?">
        </div>
        <div class="mt-6">
          <label for="location" class="text-sm">地點</label>
          <div class="relative mt-2">
            <input v-model="location" type="text" id="location" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="輸入地點或使用我的當前位置">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div class="flex items-center mt-2 gap-1 text-blue-600 text-sm cursor-pointer">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </span>
            <span>使用我的當前位置</span>
          </div>
        </div>
        <div class="mt-6">
          <p class="text-sm">投票截止時間</p>
          <div class="mt-2">
            <select v-model="expiryTime" id="expiryTime" class="w-full p-3 border border-gray-300 rounded-lg">
              <option value="15">15分鐘</option>
              <option value="30">30分鐘</option>
              <option value="60">1小時</option>
              <option value="120">2小時</option>
              <option value="0">手動結束</option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <input v-model="isAnonymous" type="checkbox" id="isAnonymous" class="mr-2">
          <label for="isAnonymous" class="text-sm text-gray-600">匿名模式 (不顯示投票者)</label>
        </div>
        <div class="mt-6">
          <button @click="handleCreateRoom" :disabled="isLoading" class="w-full bg-red-gradient text-white py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoading ? '創建中...' : '創建房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
