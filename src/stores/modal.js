import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const modal = ref(null)

  const openModal = ({
    title, 
    message, 
    confirmText, 
    cancelText, 
    confirmCallback = () => {}, 
    cancelCallback = () => {},
    type = 'info'
  }) => {
    modal.value = {
      title,
      message,
      confirmText,
      cancelText,
      confirmCallback,
      cancelCallback,
      type
    }
  }

  const closeModal = () => {
    modal.value = null
  }

  return {
    modal,
    openModal,
    closeModal
  }
})