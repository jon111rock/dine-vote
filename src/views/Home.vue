<script setup>
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import NicknameEditor from '@/components/profile/NicknameEditor.vue'
import { useRouter } from 'vue-router'

const nicknameStorage = useNicknameStorage()
const router = useRouter()

// 處理暱稱儲存成功事件
const handleNicknameSaved = (nickname) => {
  console.log('暱稱已儲存:', nickname)
}

// 導航到創建房間頁面
const navigateToCreateRoom = () => {
  router.push('/create-room')
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
        <button class="cursor-pointer w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium text-sm sm:text-base hover:shadow-lg transition-shadow">加入房間</button>
      </div>

      <!-- 版本資訊 -->
      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500">版本 1.0.0</p>
      </div>
    </div>
  </div>
</template>