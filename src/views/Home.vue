<script setup>
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import NicknameEditor from '@/components/profile/NicknameEditor.vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { onMounted, ref } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'

const nicknameStorage = useNicknameStorage()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const shouldRedirect = ref(false)
const redirectPath = ref('')

// 檢查URL參數
onMounted(() => {
  // 檢查是否有提示設置暱稱的標記
  const requireNickname = route.query.requireNickname === 'true'
  const roomCode = route.query.roomCode

  if (requireNickname) {
    toast.info('請先設置暱稱才能加入房間')
    shouldRedirect.value = true

    // 嘗試從 sessionStorage 恢復完整的重定向信息
    const redirectInfoString = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_AFTER_NICKNAME)
    if (redirectInfoString) {
      try {
        const redirectInfo = JSON.parse(redirectInfoString)
        redirectPath.value = redirectInfo.path
      } catch (err) {
        console.error('解析重定向信息失敗:', err)
        // 如果解析失敗，退回到使用 URL 參數
        if (roomCode) {
          redirectPath.value = `/join-room?roomCode=${roomCode}`
        }
      }
    } else if (roomCode) {
      // 沒有 sessionStorage 信息，使用 URL 參數
      redirectPath.value = `/join-room?roomCode=${roomCode}`
    }
  }
})

// 處理暱稱儲存成功事件
const handleNicknameSaved = (nickname) => {
  console.log('暱稱已儲存:', nickname)

  // 處理保存後的重定向邏輯
  if (shouldRedirect.value && redirectPath.value) {
    // 顯示成功訊息
    toast.success('暱稱設置成功，正在跳轉...')

    // 延遲跳轉，確保用戶看到成功消息
    setTimeout(() => {
      // 清除重定向信息
      sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_AFTER_NICKNAME)
      // 執行跳轉
      router.push(redirectPath.value)
    }, 800)
  } else {
    // 一般情況下的默認行為
    toast.success('暱稱設置成功')
    setTimeout(() => {
      router.push('/create-room')
    }, 800)
  }
}

// 導航到創建房間頁面
const navigateToCreateRoom = () => {
  router.push('/create-room')
}

// 導航到加入房間頁面
const navigateToJoinRoom = () => {
  router.push('/join-room')
}
</script>

<template>
  <div class="flex justify-center items-center min-h-screen py-8 px-4 sm:py-12 w-full">
    <div class="w-full max-w-md">
      <!-- Logo 和標語 -->
      <div class="flex flex-col items-center mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-4xl mb-2 text-logo-gradient font-medium">DineVote</h1>
        <p class="text-gray-600 text-sm sm:text-base">一起決定今天吃什麼！</p>
      </div>

      <!-- 提示訊息 -->
      <div v-if="route.query.requireNickname === 'true'" class="mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <p class="text-blue-700">請先設置暱稱，設置完成後將自動導航至目標頁面</p>
      </div>

      <!-- 主卡片 -->
      <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-6">
        <p class="text-xl font-medium text-gray-700 mb-4">{{ nicknameStorage.hasNickname() ? '歡迎回來！' : '設置您的暱稱' }}</p>
        <div>
          <NicknameEditor @nickname-saved="handleNicknameSaved" />
        </div>
      </div>

      <!-- 底部按鈕 -->
      <div class="w-full flex gap-3 sm:gap-4">
        <button class="cursor-pointer w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium text-sm sm:text-base hover:shadow-lg transition-shadow" @click="navigateToCreateRoom">創建房間</button>
        <button class="cursor-pointer w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium text-sm sm:text-base hover:shadow-lg transition-shadow" @click="navigateToJoinRoom">加入房間</button>
      </div>

      <!-- 版本資訊 -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">版本 1.0.0</p>
      </div>
    </div>
  </div>
</template>