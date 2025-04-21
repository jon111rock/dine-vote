<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { leaveRoom, getRoomById, watchRoom, updateRoomVotingStatus } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'

// 基本狀態管理
const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

// 房間狀態
const roomId = ref('')
const roomCode = ref('')
const roomOwnerId = ref('')
const participants = ref({})
const maxParticipants = ref(8)

// 用戶狀態
const currentUserId = ref('')
const isOwner = ref(false)
const isLoading = ref(false)
const isNavigating = ref(false)

// 清理函數
const unsubscribe = ref(null)

// 計算屬性
const participantsCount = computed(() => Object.keys(participants.value).length)

// ===== 參與者UI處理 =====
// 顏色管理
const backgroundColors = {
  0: 'bg-indigo-500',
  1: 'bg-pink-500',
  2: 'bg-green-500',
  3: 'bg-yellow-500',
  4: 'bg-purple-500',
  5: 'bg-red-500',
  6: 'bg-blue-500',
  7: 'bg-teal-500',
}
const colorMap = ref({})

/**
 * 為用戶分配一個唯一顏色
 * @param {string} userId - 用戶ID
 * @returns {string} 顏色類名
 */
const getColorForUser = (userId) => {
  if (!colorMap.value[userId]) {
    const usedColors = Object.values(colorMap.value)
    // 查找一個未使用的顏色
    let colorIndex = 0;
    for (let i = 0; i < 8; i++) {
      if (!usedColors.includes(backgroundColors[i])) {
        colorIndex = i;
        break;
      }
    }
    // 如果所有顏色都已使用，則使用循環值
    if (usedColors.length >= 8) {
      colorIndex = Object.keys(colorMap.value).length % 8;
    }
    colorMap.value[userId] = backgroundColors[colorIndex];
  }
  return colorMap.value[userId];
}

/**
 * 獲取用戶暱稱的首字母
 * @param {string} nickname - 用戶暱稱
 * @returns {string} 首字母
 */
const getFirstLetter = (nickname) => {
  return nickname ? nickname.charAt(0).toUpperCase() : '?'
}

/**
 * 檢查參與者是否為房主
 * @param {Object} participantData - 參與者數據
 * @returns {boolean} 是否為房主
 */
const checkIsOwner = (participantData) => {
  return participantData.isOwner
}

// ===== 房間操作 =====
/**
 * 更新房間參與者狀態
 * @param {Object} roomData - 房間數據
 */
const updateRoomState = (roomData) => {
  if (!roomData) {
    handleRoomDeleted()
    return
  }

  // 更新房間基本信息
  roomCode.value = roomData.roomCode
  roomOwnerId.value = roomData.ownerId
  isOwner.value = roomData.ownerId === currentUserId.value

  // 更新參與者
  updateParticipants(roomData.participants || {})

  // 檢查投票狀態
  if (roomData.votingStatus === 'active') {
    handleVotingStarted()
  }
}

/**
 * 更新參與者列表並分配顏色
 * @param {Object} newParticipants - 新參與者列表
 */
const updateParticipants = (newParticipants) => {
  const prevParticipants = { ...participants.value }
  participants.value = newParticipants

  // 為新參與者分配顏色
  Object.keys(newParticipants).forEach(participantId => {
    if (!prevParticipants[participantId]) {
      getColorForUser(participantId)
    }
  })
}

/**
 * 處理房間被刪除的情況
 */
const handleRoomDeleted = () => {
  toast.success('房主已離開房間')
  // 延遲跳轉，讓使用者看到提示訊息
  setTimeout(() => {
    router.push('/')
  }, 1500)
}

/**
 * 獲取當前用戶的參與者ID
 * @returns {string|null} 參與者ID
 */
const getCurrentParticipantId = () => {
  for (const [pid, participant] of Object.entries(participants.value)) {
    if (participant.userId === currentUserId.value) {
      return pid
    }
  }
  return null
}

/**
 * 處理用戶離開房間
 */
const handleLeaveRoom = async () => {
  if (!roomId.value || !currentUserId.value) {
    toast.error('系統錯誤')
    return
  }

  try {
    isLoading.value = true
    await leaveRoom(roomId.value, currentUserId.value)
    toast.success('已離開房間')
    router.push('/')
  } catch (err) {
    console.error('離開房間失敗:', err)
    toast.error('離開房間失敗')
  } finally {
    isLoading.value = false
  }
}

/**
 * 複製房間代碼到剪貼板
 */
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

// ===== 投票相關功能 =====
/**
 * 開始投票流程
 */
const startVoting = async () => {
  if (isLoading.value || isNavigating.value) return

  try {
    isLoading.value = true
    const currentParticipantId = getCurrentParticipantId()

    if (!currentParticipantId) {
      toast.error('無法找到您的參與者資訊')
      isLoading.value = false
      return
    }

    // 儲存到localStorage
    localStorage.setItem('currentRoomId', roomId.value)
    localStorage.setItem('currentParticipantId', currentParticipantId)

    // 如果是房主，更新房間狀態
    if (isOwner.value) {
      await updateRoomVotingStatus(roomId.value, 'active')
      toast.success('已通知所有成員進入投票')
    }

    // 導航到投票頁面
    isNavigating.value = true
    router.push(`/voting-form?roomId=${roomId.value}&participantId=${currentParticipantId}`)
  } catch (err) {
    console.error('開始投票失敗:', err)
    toast.error('開始投票失敗，請稍後再試')
    isLoading.value = false
    isNavigating.value = false
  }
}

/**
 * 處理投票已開始的情況
 */
const handleVotingStarted = () => {
  if (isNavigating.value) return

  const currentParticipantId = getCurrentParticipantId()
  if (!currentParticipantId) return

  isNavigating.value = true

  // 儲存參數
  localStorage.setItem('currentRoomId', roomId.value)
  localStorage.setItem('currentParticipantId', currentParticipantId)

  // 顯示提示並跳轉
  toast.info('投票已開始，正在跳轉...')
  setTimeout(() => {
    router.push(`/voting-form?roomId=${roomId.value}&participantId=${currentParticipantId}`)
  }, 1000)
}

// ===== 生命週期鉤子 =====
onMounted(async () => {
  const urlRoomId = route.query.roomId
  if (!urlRoomId) {
    router.push('/')
    return
  }

  roomId.value = urlRoomId
  currentUserId.value = nicknameStorage.nickname.value

  try {
    // 初始獲取房間數據
    const room = await getRoomById(urlRoomId)
    if (room) {
      updateRoomState(room)

      // 設置房間監聽
      unsubscribe.value = watchRoom(urlRoomId, updateRoomState)
    } else {
      toast.error('找不到房間')
      router.push('/')
    }
  } catch (err) {
    console.error('獲取房間資訊失敗:', err)
    toast.error('獲取房間資訊失敗')
    router.push('/')
  }
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})
</script>

<template>
  <div class="flex items-center h-screen flex-col">
    <div class="w-full max-w-md">
      <NavigationBack text="離開房間" :is-custom-action="true" @custom-action="handleLeaveRoom" />
      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <!-- 房間標題和資訊 -->
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">等待其他玩家加入</h1>
          <div class="flex items-center gap-2">
            <span v-if="isOwner" class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">房主</span>
            <span @click="copyRoomCode" class="text-xs text-indigo-800 cursor-pointer bg-indigo-100 px-2 py-1 rounded-lg hover:bg-indigo-200 transition-colors">
              房間代碼：{{ roomCode }}
            </span>
          </div>
        </div>

        <!-- 參與者計數 -->
        <div class="mt-4">
          <span class="text-sm text-gray-800">已加入成員({{ participantsCount }}/{{ maxParticipants }})</span>
        </div>

        <!-- 參與者列表 -->
        <div class="grid grid-cols-4 gap-3 mt-4">
          <div v-for="(participant, participantId) in participants" :key="participantId" class="text-center member-item">
            <div :class="[getColorForUser(participantId), 'w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-1 joined-animation']">
              {{ getFirstLetter(participant.userId) }}
            </div>
            <div class="flex flex-col items-center">
              <p class="text-sm text-gray-800">{{ participant.userId }}</p>
              <span v-if="checkIsOwner(participant)" class="text-xs text-green-600">房主</span>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-8 cursor-pointer disabled:opacity-70" @click="startVoting" :disabled="isLoading">
          <span v-if="isLoading">處理中...</span>
          <span v-else>開始投票</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.joined-animation {
  animation: joined 0.5s ease-in-out;
}

@keyframes joined {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  70% {
    transform: scale(1.2);
    opacity: 1;
  }

  100% {
    transform: scale(1);
  }
}

.member-item {
  transition: all 0.3s ease;
}

.bg-red-gradient {
  background: linear-gradient(to right, #f43f5e, #ef4444);
}
</style>