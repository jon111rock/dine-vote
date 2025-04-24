<script setup>
import { ref, onMounted, onUnmounted, computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { useUserStore } from '@/stores'
import { leaveRoom, getRoomById, watchRoom, updateRoomVotingStatus } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'
import { useModal } from '@/composables/useModal'

// 基本狀態管理
const route = useRoute()
const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()
const modal = useModal()
const userStore = useUserStore()

// 房間狀態
const roomId = ref('')
const roomCode = ref('')
const roomOwnerId = ref('')
const participants = ref({})
const maxParticipants = ref(8)

// 用戶狀態
const isOwner = ref(false)
const isLoading = ref(false)
const isNavigating = ref(false)
const isCopied = ref(false)

// 清理函數
const unsubscribe = ref(null)

// 計算屬性
const participantsCount = computed(() => Object.keys(participants.value).length)
const shareLink = computed(() => {
  if (!roomCode.value) return ''
  const baseUrl = window.location.origin
  return `${baseUrl}/join-room?roomCode=${roomCode.value}`
})

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
  isOwner.value = roomData.ownerId === userStore.user?.uid

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
  router.push('/')
}

/**
 * 處理用戶離開房間
 */
const handleLeaveRoom = async () => {
  if (!roomId.value || !userStore.user) {
    toast.error('系統錯誤')
    return
  }

  try {
    isLoading.value = true

    // 先進行離開房間的Firebase操作
    await leaveRoom(roomId.value, userStore.user.uid)
    toast.success('已離開房間')

    // 清除儲存的房間ID
    localStorage.removeItem('currentRoomId')

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

/**
 * 分享房間連結
 * 顯示包含連結的Modal，並提供複製功能
 */
const showShareModal = () => {
  modal.openModal({
    title: '分享房間',
    message: '將此連結分享給好友，邀請他們加入房間',
    confirmText: '複製連結',
    cancelText: '取消',
    confirmCallback: copyShareLink,
    cancelCallback: () => { },
    type: 'info'
  })
}

/**
 * 複製分享連結到剪貼板
 */
const copyShareLink = async () => {
  if (!shareLink.value) return

  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.success('分享連結已複製')
    isCopied.value = true

    // 3秒後重置複製狀態
    setTimeout(() => {
      isCopied.value = false
    }, 3000)
  } catch (err) {
    console.error('複製分享連結失敗:', err)
    toast.error('複製失敗')
  }
}

// ===== 投票相關功能 =====
/**
 * 開始投票流程
 */
const startVoting = async () => {
  if (isLoading.value || isNavigating.value) return

  // 根據是否為房主顯示不同的提示信息
  const message = isOwner.value
    ? '開始投票後所有成員將進入投票頁面，確定要開始嗎？'
    : '確定要開始投票嗎？'

  // 顯示確認Modal
  modal.openModal({
    title: '確認開始投票',
    message,
    confirmText: '開始投票',
    cancelText: '再等等',
    confirmCallback: confirmStartVoting,
    cancelCallback: () => { },
    type: 'info'
  })
}

/**
 * 確認開始投票後執行
 */
const confirmStartVoting = async () => {
  try {
    isLoading.value = true

    if (!userStore.user) {
      toast.error('您尚未登入，請先登入')
      isLoading.value = false
      return
    }

    // 儲存到localStorage
    localStorage.setItem('currentRoomId', roomId.value)

    // 如果是房主，更新房間狀態
    if (isOwner.value) {
      await updateRoomVotingStatus(roomId.value, 'active')
    }

    // 跳轉到投票頁面
    isNavigating.value = true
    router.push(`/voting-form?roomId=${roomId.value}`)
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

  if (!userStore.user) {
    toast.error('您尚未登入，請先登入')
    return
  }

  isNavigating.value = true

  // 儲存房間ID
  localStorage.setItem('currentRoomId', roomId.value)

  // 顯示提示並跳轉
  toast.info('投票已開始，正在跳轉...')
  setTimeout(() => {
    router.push(`/voting-form?roomId=${roomId.value}`)
  }, 1000)
}

// ===== 生命週期鉤子 =====
onMounted(async () => {
  const urlRoomId = route.query.roomId
  if (!urlRoomId) {
    router.push('/')
    return
  }

  // 檢查是否已登入
  if (!userStore.user) {
    toast.error('請先登入')
    router.push('/login')
    return
  }

  roomId.value = urlRoomId

  // 儲存房間ID
  localStorage.setItem('currentRoomId', urlRoomId)

  // 獲取房間資訊
  try {
    const roomData = await getRoomById(urlRoomId)
    if (!roomData) {
      toast.error('房間不存在')
      router.push('/')
      return
    }

    // 更新房間狀態
    updateRoomState(roomData)

    // 設置監聽
    unsubscribe.value = watchRoom(urlRoomId, updateRoomState)
  } catch (err) {
    console.error('獲取房間失敗:', err)
    toast.error('獲取房間資訊失敗')
    router.push('/')
  }
})

/**
 * 清理資源
 */
onUnmounted(() => {
  // 移除監聽
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})
</script>

<template>
  <div class="flex items-center h-screen flex-col p-4 sm:p-2">
    <div class="w-full max-w-md">
      <NavigationBack text="離開房間" :is-custom-action="true" @custom-action="handleLeaveRoom" />

      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <!-- 房間標題和資訊 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h1 class="text-2xl font-bold">等待其他玩家加入</h1>
            <span v-if="isOwner" class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-lg">房主</span>
          </div>

          <!-- 房間代碼和分享按鈕 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span @click="copyRoomCode" class="text-xs text-indigo-800 cursor-pointer bg-indigo-100 px-2 py-1 rounded-lg hover:bg-indigo-200 transition-colors">
                房間代碼：{{ roomCode }}
              </span>
              <button @click="showShareModal" class="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
            </div>
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
              {{ getFirstLetter(participant.displayName) }}
            </div>
            <div class="flex flex-col items-center">
              <p class="text-sm text-gray-800">{{ participant.displayName }}</p>
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