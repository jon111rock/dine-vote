<script setup>
import ToastContainer from './components/common/ToastContainer.vue'
</script>

<template>
  <div>
    <main>
      <router-view />
    </main>
    <ToastContainer />
  </div>
</template>