<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
const participants = ref({})
const maxParticipants = ref(8)
const roomOwnerId = ref('')
const currentUserId = ref('')

// 計算已加入成員數
const participantsCount = computed(() => {
  return Object.keys(participants.value).length
})

// 生成隨機顏色
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

// 獲取顯示的首字
const getFirstLetter = (nickname) => {
  return nickname ? nickname.charAt(0).toUpperCase() : '?'
}

// 檢查是否為房主
const checkIsOwner = (participantData) => {
  return participantData.isOwner
}

onMounted(async () => {
  const urlRoomId = route.query.roomId
  if (urlRoomId) {
    roomId.value = urlRoomId
    currentUserId.value = nicknameStorage.nickname.value

    try {
      const room = await getRoomById(urlRoomId)
      if (room) {
        roomCode.value = room.roomCode
        roomOwnerId.value = room.ownerId
        isOwner.value = room.ownerId === currentUserId.value
        participants.value = room.participants || {}

        // 為所有參與者分配顏色
        Object.keys(participants.value).forEach(participantId => {
          getColorForUser(participantId)
        })

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
          roomOwnerId.value = room.ownerId
          isOwner.value = room.ownerId === currentUserId.value

          // 更新參與者列表
          const prevParticipants = { ...participants.value }
          participants.value = room.participants || {}

          // 為新參與者分配顏色
          Object.keys(participants.value).forEach(participantId => {
            if (!prevParticipants[participantId]) {
              getColorForUser(participantId)
            }
          })
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

const startVoting = () => {
  console.log('開始投票')
  router.push('/voting-form')
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
          <span class="text-sm text-gray-800">已加入成員({{ participantsCount }}/{{ maxParticipants }})</span>
        </div>
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
        <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-8 cursor-pointer" @click="startVoting">開始投票</button>
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
</style>