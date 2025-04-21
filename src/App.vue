<script setup>
import ToastContainer from '@/components/common/ToastContainer.vue'
import Modal from '@/components/common/Modal.vue'
</script>

<template>
  <div>
    <main class="router-view-container">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in" appear>
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <ToastContainer />
    <Modal />
  </div>
</template>

<style>
/* 頁面轉場特效 */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>