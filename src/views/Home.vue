<script setup>
import { onMounted, ref } from 'vue'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { useToast } from '@/composables/useToast'
import NicknameEditor from '@/components/profile/NicknameEditor.vue'

const toast = useToast()
const nicknameStorage = useNicknameStorage()

// 處理暱稱儲存成功事件
const handleNicknameSaved = (nickname) => {
  console.log('暱稱已儲存:', nickname)
}
</script>

<template>
  <div class="flex justify-center items-center h-screen flex-col">
    <div class="max-w-md w-full">
      <div class="flex flex-col items-center">
        <h1 class="text-4xl mb-2 text-logo-gradient font-medium">DineVote</h1>
        <p class="text-gray-600">一起決定今天吃什麼！</p>
      </div>
      <div class="bg-white p-8 rounded-xl shadow-lg mt-6">
        <p class="text-xl font-medium text-gray-700">{{ nicknameStorage.hasNickname() ? '歡迎回來！' : '設置您的暱稱' }}</p>
        <div class="mt-4">
          <NicknameEditor @nickname-saved="handleNicknameSaved" />
        </div>
      </div>
      <div class="w-full mt-8 flex gap-4">
        <button class="w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium">創建房間</button>
        <button class="w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium">加入房間</button>
      </div>
    </div>
  </div>
</template>