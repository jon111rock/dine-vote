import { ref } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { useLocalStorage } from './useLocalStorage'

export function useNicknameStorage() {
  const { setItem, getItem, removeItem } = useLocalStorage()
  const nickname = ref(getItem(STORAGE_KEYS.NICKNAME, ''))

  const saveNickname = (newNickname) => {
    if (!newNickname?.trim()) {
      return false
    }
    
    const success = setItem(STORAGE_KEYS.NICKNAME, newNickname.trim())
    if (success) {
      nickname.value = newNickname.trim()
    }
    return success
  }

  const clearNickname = () => {
    const success = removeItem(STORAGE_KEYS.NICKNAME)
    if (success) {
      nickname.value = ''
    }
    return success
  }

  const hasNickname = () => {
    return !!nickname.value
  }

  return {
    nickname,
    saveNickname,
    clearNickname,
    hasNickname
  }
} 