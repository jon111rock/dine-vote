import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定義 Toast 類型常數
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
}

// Toast ID 計數器
let toastId = 0

export const useToastStore = defineStore('toast', () => {
  // 存儲所有 toast 的數組
  const toasts = ref([])

  // 添加 toast
  function addToast(message, options = {}) {
    const id = toastId++
    const toast = {
      id,
      message,
      type: options.type || TOAST_TYPES.INFO,
      title: options.title || getDefaultTitle(options.type),
      duration: options.duration || 3000,
      timestamp: Date.now()
    }
    
    toasts.value.push(toast)
    
    // 設置自動移除（如果 duration > 0）
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration)
    }
    
    return id
  }
  
  // 移除 toast
  function removeToast(id) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  // 清空所有 toast
  function clearToasts() {
    toasts.value = []
  }
  
  // 快捷方法
  function success(message, options = {}) {
    return addToast(message, { ...options, type: TOAST_TYPES.SUCCESS })
  }
  
  function error(message, options = {}) {
    return addToast(message, { ...options, type: TOAST_TYPES.ERROR })
  }
  
  function info(message, options = {}) {
    return addToast(message, { ...options, type: TOAST_TYPES.INFO })
  }
  
  function warning(message, options = {}) {
    return addToast(message, { ...options, type: TOAST_TYPES.WARNING })
  }
  
  // 根據類型獲取默認標題
  function getDefaultTitle(type) {
    switch(type) {
      case TOAST_TYPES.SUCCESS:
        return '成功'
      case TOAST_TYPES.ERROR:
        return '錯誤'
      case TOAST_TYPES.WARNING:
        return '警告'
      case TOAST_TYPES.INFO:
      default:
        return '提示'
    }
  }
  
  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    info,
    warning
  }
}) 