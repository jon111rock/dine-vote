import { useModalStore } from '@/stores/modal'

export const useModal = () => {
  const modalStore = useModalStore()

  /**
   * 開啟 Modal
   * @param {Object} options - Modal 配置選項
   * @param {string} options.title - Modal 標題
   * @param {string} options.message - Modal 訊息
   * @param {string} options.cancelText - 取消按鈕文字
   * @param {string} options.confirmText - 確定按鈕文字
   * @param {function} options.cancelCallback - 取消按鈕點擊事件
   * @param {function} options.confirmCallback - 確定按鈕點擊事件
   * @param {string} options.type - Modal 類型 (info, success, warning, error)
   */
  const openModal = (options) => {
    modalStore.openModal(options)
  }

  /**
   * 關閉 Modal
   */
  const closeModal = () => {
    modalStore.closeModal()
  }

  return {
    openModal,
    closeModal
  }
}