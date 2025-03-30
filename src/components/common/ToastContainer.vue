<script setup>
import { useToastStore } from '../../stores/toast'
import Toast from './Toast.vue'
import { Transition, TransitionGroup } from 'vue'

const toastStore = useToastStore()
</script>

<template>
  <Teleport to="body">
    <!-- toast 容器 -->
    <div class="fixed top-4 left-0 right-0 mx-auto flex flex-col items-center z-50 pointer-events-none space-y-2">
      <TransitionGroup name="toast">
        <Toast v-for="toast in toastStore.toasts" :key="toast.id" :id="toast.id" :type="toast.type" :title="toast.title" :message="toast.message" :duration="toast.duration" @close="toastStore.removeToast" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>