<script setup>
import Modal from './Modal.vue'
import { useModalStore } from '@/stores/modal'

const modalStore = useModalStore()

</script>

<template>
  <Transition name="modal-backdrop">
    <div class="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4 sm:p-2" v-if="modalStore.modal">
      <Transition name="modal-content">
        <Modal :type="modalStore.modal.type" :title="modalStore.modal.title" :message="modalStore.modal.message" />
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* 背景動畫 */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Modal內容動畫 */
.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s ease;
}

.modal-content-enter-from,
.modal-content-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>