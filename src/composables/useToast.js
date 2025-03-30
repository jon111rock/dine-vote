import { useToastStore, TOAST_TYPES } from '../stores/toast'

/**
 * 全局 Toast 通知系統的訪問點
 * 用於在任何地方顯示 Toast 通知
 */
export function useToast() {
  const toastStore = useToastStore()

  /**
   * 顯示一個 Toast 通知
   * @param {string} message - 通知訊息
   * @param {Object} options - 選項
   * @param {string} options.title - 標題
   * @param {string} options.type - 類型 ('success'|'error'|'info'|'warning')
   * @param {number} options.duration - 持續時間（毫秒），0 表示不自動關閉
   * @returns {number} Toast ID
   */
  function showToast(message, options = {}) {
    return toastStore.addToast(message, options)
  }

  /**
   * 顯示成功 Toast
   * @param {string} message - 通知訊息
   * @param {Object} options - 選項
   * @returns {number} Toast ID
   */
  function success(message, options = {}) {
    return toastStore.success(message, options)
  }

  /**
   * 顯示錯誤 Toast
   * @param {string} message - 通知訊息
   * @param {Object} options - 選項
   * @returns {number} Toast ID
   */
  function error(message, options = {}) {
    return toastStore.error(message, options)
  }

  /**
   * 顯示資訊 Toast
   * @param {string} message - 通知訊息
   * @param {Object} options - 選項
   * @returns {number} Toast ID
   */
  function info(message, options = {}) {
    return toastStore.info(message, options)
  }

  /**
   * 顯示警告 Toast
   * @param {string} message - 通知訊息
   * @param {Object} options - 選項
   * @returns {number} Toast ID
   */
  function warning(message, options = {}) {
    return toastStore.warning(message, options)
  }

  /**
   * 移除指定 ID 的 Toast
   * @param {number} id - Toast ID
   */
  function remove(id) {
    toastStore.removeToast(id)
  }

  /**
   * 清除所有 Toast
   */
  function clear() {
    toastStore.clearToasts()
  }

  return {
    // 方法
    showToast,
    success,
    error,
    info,
    warning,
    remove,
    clear,
    
    // 常數
    TOAST_TYPES
  }
} 