<script setup>
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import NicknameEditor from '@/components/profile/NicknameEditor.vue'
import LogoHeader from '@/components/common/LogoHeader.vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { onMounted, ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { useAuth } from '@/composables/auth/useAuth'
import DIcon from '@/components/common/DIcon.vue'

const nicknameStorage = useNicknameStorage()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const { user, logout } = useAuth()
const shouldRedirect = ref(false)
const redirectPath = ref('')
const isLogoutLoading = ref(false)

// 計算屬性：顯示用戶名稱
const userDisplayName = computed(() => {
  if (!user.value) return '';
  return user.value.displayName || user.value.email || '用戶';
})

// 計算屬性：是否顯示登出按鈕
const showLogout = computed(() => {
  return !!user.value;
})

// 計算屬性：是否應該提示用戶使用顯示名稱
const shouldSuggestDisplayNameAsNickname = computed(() => {
  if (!user.value || !user.value.displayName) return false;
  return nicknameStorage.shouldUpdateFromDisplayName(user.value.displayName);
})

// 使用顯示名稱作為暱稱
const useDisplayNameAsNickname = () => {
  if (user.value?.displayName) {
    const success = nicknameStorage.saveNickname(user.value.displayName);
    if (success) {
      toast.success('已使用您的帳號名稱作為暱稱');
    }
  }
}

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

// 處理登出
const handleLogout = async () => {
  isLogoutLoading.value = true;
  try {
    await logout();
    toast.success('登出成功');
    // 清除暱稱資料
    nicknameStorage.clearNickname();
    // 重定向至登入頁
    router.push('/login');
  } catch (error) {
    toast.error('登出失敗：' + error.message);
  } finally {
    isLogoutLoading.value = false;
  }
}

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
      <LogoHeader />

      <!-- 用戶資訊 -->
      <div v-if="user" class="mb-4 flex justify-between items-center">
        <div class="text-sm text-gray-700">
          登入身份：{{ userDisplayName }}
        </div>
        <button @click="handleLogout" class="text-sm text-red-600 hover:text-red-800 flex items-center transition-colors" :disabled="isLogoutLoading">
          <span v-if="!isLogoutLoading">登出</span>
          <span v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            登出中...
          </span>
          <DIcon v-if="!isLogoutLoading" name="log-out" class="ml-1 w-4 h-4" />
        </button>
      </div>

      <!-- 提示訊息 -->
      <div v-if="route.query.requireNickname === 'true'" class="mb-4 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <p class="text-blue-700">請先設置暱稱，設置完成後將自動導航至目標頁面</p>
      </div>

      <!-- 使用顯示名稱提示 -->
      <div v-if="shouldSuggestDisplayNameAsNickname" class="mb-4 bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
        <div class="flex justify-between items-center">
          <p class="text-indigo-700">想使用您的帳號名稱「{{ user.displayName }}」作為暱稱嗎？</p>
          <button @click="useDisplayNameAsNickname" class="ml-4 px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-sm whitespace-nowrap">
            使用
          </button>
        </div>
      </div>

      <!-- 主卡片 -->
      <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-6">
        <p class="text-xl font-medium text-gray-700 mb-4">{{ nicknameStorage.hasNickname() ? '歡迎回來！' : '設置您的暱稱' }}</p>
        <div>
          <NicknameEditor @nickname-saved="handleNicknameSaved" :default-value="user?.displayName" />
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