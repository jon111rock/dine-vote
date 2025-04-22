<script setup>
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import NicknameEditor from '@/components/profile/NicknameEditor.vue'
import LogoHeader from '@/components/common/LogoHeader.vue'
import UserDropdown from '@/components/profile/UserDropdown.vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { onMounted, ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { useAuth } from '@/composables/auth/useAuth'

const nicknameStorage = useNicknameStorage()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { user, logout, initialize } = useAuth()
const shouldRedirect = ref(false)
const redirectPath = ref('')

// 計算屬性：是否應該提示用戶使用顯示名稱
const shouldSuggestDisplayNameAsNickname = computed(() => {
  if (!user.value || !user.value.displayName) return false;
  return nicknameStorage.shouldUpdateFromDisplayName(user.value.displayName);
})

// 處理登出
const handleLogout = async () => {
  try {
    await logout()
    toast.success('登出成功')
    // 清除暱稱資料
    nicknameStorage.clearNickname()
    // 重定向至登入頁
    router.push('/login')
  } catch (error) {
    toast.error('登出失敗：' + error.message)
  }
}

// 檢查URL參數
onMounted(() => {
  initialize()
  
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

// 導航到創建房間頁面
const navigateToCreateRoom = () => {
  router.push('/create-room')
}

// 導航到加入房間頁面
const navigateToJoinRoom = () => {
  router.push('/join-room')
}
console.log('version',import.meta.env.VITE_APP_VERSION);

const version = computed(() => {
  return import.meta.env.VITE_APP_VERSION
})
</script>

<template>
  <div class="flex flex-col min-h-screen w-full">
    <!-- 用戶下拉菜單 -->
    <div v-if="true" class="home-user-dropdown">
      <UserDropdown :user="user" @logout="handleLogout" />
    </div>

    <!-- 主要內容 -->
    <div class="flex justify-center items-center flex-grow py-8 px-4 sm:py-12 w-full">
      <div class="w-full max-w-md">
        <!-- Logo 和標語 -->
        <LogoHeader />

        <!-- 提示訊息 -->
        <div v-if="route.query.requireNickname === 'true'" class="mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <p class="text-blue-700">請先設置暱稱</p>
        </div>


        <!-- 主卡片 -->
        <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-6">
          <p class="text-xl font-medium text-gray-700 mb-4">{{ nicknameStorage.hasNickname() ? '歡迎回來！' : '設置您的暱稱' }}</p>
          <div>
            <NicknameEditor :default-value="user?.displayName" />
          </div>
        </div>

        <!-- 底部按鈕 -->
        <div class="w-full flex gap-3 sm:gap-4">
          <button class="cursor-pointer w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium text-sm sm:text-base hover:shadow-lg transition-shadow" @click="navigateToCreateRoom">創建房間</button>
          <button class="cursor-pointer w-1/2 bg-white rounded-md p-2 py-3 shadow-md text-gray-700 font-medium text-sm sm:text-base hover:shadow-lg transition-shadow" @click="navigateToJoinRoom">加入房間</button>
        </div>

        <!-- 版本資訊 -->
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">版本 {{ version }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 用戶下拉菜單樣式 */
.home-user-dropdown {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 100;
}
</style>