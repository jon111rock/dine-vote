<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
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
const isCopied = ref(false)

// 清理函數
const unsubscribe = ref(null)

// 跨分頁通訊相關
const tabChannel = ref(null)
const sessionId = ref('')
const isAlreadyInRoom = ref(false)

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

// ===== 身份識別與分頁管理 =====
/**
 * 生成唯一的會話ID
 * @returns {string} 唯一會話ID
 */
const generateSessionId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

/**
 * 取得或創建會話ID
 * @returns {string} 會話ID
 */
const getOrCreateSessionId = () => {
  // 檢查是否已存在會話ID
  let existingId = localStorage.getItem('dineVoteSessionId')

  if (!existingId) {
    // 創建新的會話ID
    existingId = generateSessionId()
    localStorage.setItem('dineVoteSessionId', existingId)
  }

  return existingId
}

/**
 * 檢查是否已在其他分頁加入該房間
 * @param {string} _roomId - 房間ID
 * @returns {boolean} 是否已在其他分頁加入
 */
const checkIfAlreadyJoined = (_roomId) => {
  const activeRoomKey = `dineVoteActiveRoom_${_roomId}`
  const activeTabId = localStorage.getItem(activeRoomKey)

  // 如果有活動分頁且不是當前分頁，表示已在其他分頁加入
  if (activeTabId && activeTabId !== sessionId.value) {
    return true
  }

  return false
}

/**
 * 註冊當前分頁為房間活動分頁
 * @param {string} _roomId - 房間ID
 */
const registerActiveTab = (_roomId) => {
  const activeRoomKey = `dineVoteActiveRoom_${_roomId}`
  localStorage.setItem(activeRoomKey, sessionId.value)

  // 通知其他分頁
  tabChannel.value.postMessage({
    type: 'TAB_REGISTERED',
    roomId: _roomId,
    sessionId: sessionId.value
  })
}

/**
 * 註銷當前分頁作為房間活動分頁
 * @param {string} _roomId - 房間ID
 * @param {boolean} [notify=true] - 是否通知其他分頁
 */
const unregisterActiveTab = (_roomId, notify = true) => {
  const activeRoomKey = `dineVoteActiveRoom_${_roomId}`
  const currentActiveTab = localStorage.getItem(activeRoomKey)

  // 只有當前分頁是活動分頁時才註銷
  if (currentActiveTab === sessionId.value) {
    localStorage.removeItem(activeRoomKey)

    // 通知其他分頁
    if (notify && tabChannel.value && !tabChannel.value.closed) {
      try {
        tabChannel.value.postMessage({
          type: 'TAB_UNREGISTERED',
          roomId: _roomId,
          sessionId: sessionId.value
        })
      } catch (err) {
        console.error('發送分頁消息失敗:', err)
      }
    }
  }
}

/**
 * 處理來自其他分頁的消息
 * @param {MessageEvent} event - 消息事件
 */
const handleTabMessage = (event) => {
  const { type, roomId: messageRoomId, sessionId: messageSessionId } = event.data

  // 只處理與當前房間相關的消息
  if (messageRoomId === roomId.value) {
    if (type === 'TAB_REGISTERED' && messageSessionId !== sessionId.value) {
      // 其他分頁已註冊為活動分頁
      isAlreadyInRoom.value = true

      // 提示用戶
      toast.warning('您已在其他分頁中加入此房間')
    } else if (type === 'TAB_UNREGISTERED' && messageSessionId !== sessionId.value) {
      // 其他分頁已註銷活動狀態，可以接管
      isAlreadyInRoom.value = false
      registerActiveTab(roomId.value)
    }
  }
}

/**
 * 初始化分頁通訊
 */
const initTabCommunication = () => {
  // 初始化會話ID
  sessionId.value = getOrCreateSessionId()

  // 創建廣播通道
  tabChannel.value = new BroadcastChannel('dineVoteTabChannel')
  tabChannel.value.addEventListener('message', handleTabMessage)
}

/**
 * 清理分頁通訊
 */
const cleanupTabCommunication = () => {
  if (tabChannel.value) {
    tabChannel.value.removeEventListener('message', handleTabMessage)
    tabChannel.value.close()
  }
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

    // 先進行註銷活動分頁操作，確保在清理前執行
    unregisterActiveTab(roomId.value)

    // 然後進行離開房間的Firebase操作
    await leaveRoom(roomId.value, currentUserId.value, sessionId.value)
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

// ===== 頁面可見性處理 =====
/**
 * 處理頁面可見性變化
 */
const handleVisibilityChange = () => {
  // 當頁面變為可見時
  if (document.visibilityState === 'visible' && roomId.value) {
    // 檢查是否已在其他分頁加入
    isAlreadyInRoom.value = checkIfAlreadyJoined(roomId.value)

    if (!isAlreadyInRoom.value) {
      // 註冊為活動分頁
      registerActiveTab(roomId.value)
    } else {
      // 提示用戶
      toast.warning('您已在其他分頁中加入此房間')
    }
  }
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

  // 初始化分頁通訊
  initTabCommunication()

  // 檢查是否已在其他分頁加入該房間
  isAlreadyInRoom.value = checkIfAlreadyJoined(urlRoomId)

  if (isAlreadyInRoom.value) {
    toast.warning('您已在其他分頁中加入此房間')
  } else {
    // 註冊為活動分頁
    registerActiveTab(urlRoomId)
  }

  // 監聽頁面可見性變化
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // 監聽頁面卸載事件
  window.addEventListener('beforeunload', () => {
    unregisterActiveTab(urlRoomId, false)
  })

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
  // 先執行訂閱清理
  if (unsubscribe.value) {
    unsubscribe.value()
  }

  // 先註銷活動分頁，因為這需要用到未關閉的tabChannel
  if (roomId.value) {
    unregisterActiveTab(roomId.value)
  }

  // 最後清理分頁通訊
  cleanupTabCommunication()

  // 移除事件監聽
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="flex items-center h-screen flex-col">
    <div class="w-full max-w-md">
      <NavigationBack text="離開房間" :is-custom-action="true" @custom-action="handleLeaveRoom" />

      <!-- 多分頁警告 -->
      <div v-if="isAlreadyInRoom" class="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
        <p class="text-sm font-medium">您已在其他分頁開啟此房間</p>
        <p class="text-xs mt-1">建議關閉此分頁以避免重複參與</p>
      </div>

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
              {{ getFirstLetter(participant.userId) }}
            </div>
            <div class="flex flex-col items-center">
              <p class="text-sm text-gray-800">{{ participant.userId }}</p>
              <span v-if="checkIsOwner(participant)" class="text-xs text-green-600">房主</span>
            </div>
          </div>
        </div>

        <!-- 操作按鈕 -->
        <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-8 cursor-pointer disabled:opacity-70" @click="startVoting" :disabled="isLoading || isAlreadyInRoom">
          <span v-if="isLoading">處理中...</span>
          <span v-else-if="isAlreadyInRoom">請在您的活動分頁操作</span>
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