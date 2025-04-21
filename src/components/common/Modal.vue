<script setup>
import DIcon from "@/components/common/DIcon.vue"
import { useModalStore } from '@/stores/modal'
import { computed } from 'vue'

const modalStore = useModalStore()

const props = defineProps({
  title: {
    type: String,
    required: true,
    default: '標題'
  },
  message: {
    type: String,
    required: true,
    default: '訊息'
  }
})

const cancelText = computed(() => {
  return modalStore.modal?.cancelText || '取消'
})

const confirmText = computed(() => {
  return modalStore.modal?.confirmText || '確定'
})

const handleConfirm = () => {
  modalStore.modal.confirmCallback()
  modalStore.closeModal()
}

const handleCancel = () => {
  modalStore.modal.cancelCallback()
  modalStore.closeModal()
}

</script>

<template>
  <div class="min-w-[300px] bg-white p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
    <DIcon type="info" size="12" />
    <h1 class="text-xl font-bold">{{ props.title }}</h1>
    <p class="text-gray-500">{{ props.message }}</p>
    <div class="flex gap-4 w-full">
      <button class="w-full border border-gray-300 px-4 py-2 rounded-md cursor-pointer" @click="handleCancel()">{{ cancelText }}</button>
      <button class="w-full bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer" @click="handleConfirm()">{{ confirmText }}</button>
    </div>
  </div>
</template>