<script setup>
import ToastContainer from '@/components/common/ToastContainer.vue'
import ModalContainer from '@/components/common/ModalContainer.vue'
import { useAuth } from '@/composables/auth/useAuth'
import { useToast } from '@/composables/useToast'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const { user, logout, initialize } = useAuth()
const toast = useToast()
const nicknameStorage = useNicknameStorage()
const router = useRouter()
const isLogoutLoading = ref(false)

// 初始化身份驗證
onMounted(() => {
  initialize()
})

// 處理登出
const handleLogout = async () => {
  isLogoutLoading.value = true
  try {
    await logout()
    toast.success('登出成功')
    // 清除暱稱資料
    nicknameStorage.clearNickname()
    // 重定向至登入頁
    router.push('/login')
  } catch (error) {
    toast.error('登出失敗：' + error.message)
  } finally {
    isLogoutLoading.value = false
  }
}
</script>

<template>
  <div class="app-container">
    <main class="router-view-container">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <ToastContainer />
    <ModalContainer />
  </div>
</template>

<style>
/* 頁面轉場特效 */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 確保應用程序容器有適當的間距 */
.app-container {
  min-height: 100vh;
  position: relative;
}
</style>