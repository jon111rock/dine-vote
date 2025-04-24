<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { useUserStore } from '@/stores'
import { getRoomByCode, joinRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'
import { useRoomStore } from '@/stores/room'
import { useAuth } from '@/composables/auth/useAuth'

const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()
const roomStore = useRoomStore()
const userStore = useUserStore()
const auth = useAuth()
// 接收從路由傳遞的props
const props = defineProps({
  roomCode: {
    type: String,
    default: ''
  }
})

const roomCode = ref('')
const isLoading = ref(false)
const autoJoin = ref(false)
const hasTriedAutoJoin = ref(false)

const isButtonDisabled = computed(() => {
  return roomCode.value.length !== 6 || isLoading.value
})

// 監聽暱稱變化，支持動態暱稱設置後的重試
watch(() => nicknameStorage.hasNickname(), (hasNickname) => {
  // 如果暱稱已設置，且標記為自動加入，且尚未嘗試過自動加入
  if (hasNickname && autoJoin.value && !hasTriedAutoJoin.value && roomCode.value.length === 6) {
    hasTriedAutoJoin.value = true
    setTimeout(() => {
      handleJoinRoom()
    }, 300)
  }
})

// 處理加入房間邏輯
const handleJoinRoom = async () => {
  if (!nicknameStorage.hasNickname()) {
    toast.error('請先設定暱稱')
    return
  }
  
  if (!userStore.user) {
    toast.error('請先登入')
    router.push('/login')
    return
  }

  try {
    isLoading.value = true

    // 驗證房間
    const room = await validateRoom()
    if (!room) {
      return
    }

    roomStore.setRoomStore({
      roomName: room.name,
      roomId: room.id,
      roomOwner: room.ownerId
    })

    // 加入房間，使用用戶UID和暱稱
    const displayName = nicknameStorage.nickname.value
    const result = await joinRoom(room.id, userStore.user.uid, displayName)

    if (result.isExisting) {
      toast.info('使用已有的房間身份')
    } else {
      toast.success('加入房間成功')
    }

    // 儲存當前房間ID
    localStorage.setItem('currentRoomId', room.id)

    // 跳轉到等待房間
    router.push(`/waiting-room?roomId=${room.id}`)
  } catch (err) {
    console.error('加入房間失敗:', err)
    toast.error(err.message || '加入房間失敗')
  } finally {
    isLoading.value = false
  }
}

// 初始化房間代碼並嘗試自動加入
const initializeRoomCodeAndAutoJoin = () => {
  // 優先使用路由props中的roomCode
  if (props.roomCode) {
    roomCode.value = props.roomCode
    autoJoin.value = true
  }
  // 兼容舊版的code參數
  else if (route.query.code) {
    roomCode.value = String(route.query.code) // 確保是字串
    autoJoin.value = true
  }
  // 兼容URL參數
  else if (route.query.roomCode) {
    roomCode.value = String(route.query.roomCode) // 確保是字串
    autoJoin.value = true
  }

  // 如果自動填入了有效長度的代碼，且用戶已設置暱稱，則自動觸發加入按鈕
  if (autoJoin.value && roomCode.value.length === 6 && nicknameStorage.hasNickname()) {
    hasTriedAutoJoin.value = true
    // 延遲300ms後觸發，給頁面時間渲染
    setTimeout(() => {
      handleJoinRoom()
    }, 300)
  }
}

const handleIfUserStoreIsEmpty = async () => {
  if (!userStore.user) {
    await auth.initialize()
    userStore.setUser(auth.user.value)
  }
}

onMounted(async () => {

  // 檢查用戶是否已登入
  handleIfUserStoreIsEmpty();

  // 檢查用戶是否已設置暱稱
  if (!nicknameStorage.hasNickname()) {
    toast.warning('請先在首頁設定您的暱稱！')
    router.push('/')
    return
  }

  initializeRoomCodeAndAutoJoin()
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
          <button @click="handleJoinRoom" :disabled="isButtonDisabled" class="cursor-pointer w-full bg-red-gradient text-white font-medium py-3 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {{ isLoading ? '處理中...' : '加入房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-red-gradient {
  background: linear-gradient(to right, #f43f5e, #ef4444);
}
</style>
