import { useModalStore } from '@/stores/modal'

export const useModal = () => {
  const modalStore = useModalStore()

  /**
   * 開啟 Modal
   * @param {string} title - Modal 標題
   * @param {string} message - Modal 訊息
   * @param {string} cancelText - 取消按鈕文字
   * @param {string} confirmText - 確定按鈕文字
   * @param {string} type - Modal 類型
   * @param {function} cancelCallback - 取消按鈕點擊事件
   * @param {function} confirmCallback - 確定按鈕點擊事件
   */
  const openModal = (title, message, cancelText, confirmText, cancelCallback, confirmCallback, type) => {
    modalStore.openModal(title, message, cancelText, confirmText, cancelCallback, confirmCallback, type)
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