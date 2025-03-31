<script setup>
import NavigationBack from '@/components/common/NavigationBack.vue'
</script>

<template>
  <div class="flex items-center min-h-screen flex-col w-full py-8 px-4">
    <div class="w-full max-w-md">
      <NavigationBack />
      <div class="w-full max-w-md bg-white p-6 sm:p-8 rounded-xl shadow-lg">
        <h1 class="text-2xl font-bold text-center text-gray-800">加入房間</h1>
        <div class="mt-6">
          <p class="text-sm font-medium text-gray-600">房間代碼</p>
          <input class="text-center text-lg mt-2 w-full border border-gray-300 rounded-md p-4" type="text" placeholder="請輸入房間代碼" />
        </div>
        <div class="mt-6">
          <button class="cursor-pointer w-full bg-red-gradient text-white font-medium py-3 rounded-md">加入房間</button>
        </div>
      </div>
    </div>
  </div>
</template>

