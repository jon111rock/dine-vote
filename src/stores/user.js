import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'
import { useToast } from '@/composables/useToast'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'

export const useUserStore = defineStore('user', () => {
  // 狀態
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 計算屬性
  const isAuthenticated = computed(() => !!user.value)
  const uid = computed(() => user.value?.uid)
  const displayName = computed(() => user.value?.displayName || '')
  const email = computed(() => user.value?.email || '')
  const photoURL = computed(() => user.value?.photoURL || '')

  // 操作方法
  const setUser = (userData) => {
    if (userData) {
      user.value = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || ''
      }
    } else {
      user.value = null
    }
  }

  const clearUser = () => {
    user.value = null
  }

  const logout = async () => {
    const toast = useToast()
    const nicknameStorage = useNicknameStorage()

    loading.value = true
    error.value = null

    try {
      await signOut(auth)
      clearUser()
      nicknameStorage.clearNickname()
      return true
    } catch (err) {
      error.value = err.message
      toast.error(`登出失敗：${err.message}`)
      return false
    } finally {
      loading.value = false
    }
  }

  // 返回
  return {
    user,
    loading,
    error,
    isAuthenticated,
    uid,
    displayName,
    email,
    photoURL,
    setUser,
    clearUser,
    logout
  }
}) 