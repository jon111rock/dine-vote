<script setup>
import NavigationBack from '../components/common/NavigationBack.vue';
</script>

<template>
  <div class="flex items-center h-screen flex-col">
    <div class="w-full max-w-md">
      <NavigationBack backPath="/create-room" />
      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">等待其他玩家加入</h1>
          <span class="text-xs text-indigo-800 cursor-pointer bg-indigo-100 px-2 py-1 rounded-lg">房間代碼：XYZ123</span>
        </div>
        <div class="mt-4">
          <span class="text-sm text-gray-800">已加入成員(2/3)</span>
        </div>
        <div class="grid grid-cols-4 gap-3 mt-4">
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center text-white text-lg font-bold mx-auto mb-1 joined-animation">小</div>
            <p class="text-sm text-gray-800">小明</p>
          </div>
          <div class="text-center">
            <!-- 增加其他範例 -->
            <div class="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center text-white text-lg font-bold mx-auto mb-1 joined-animation">美</div>
            <p class="text-sm text-gray-800">美美</p>
          </div>
        </div>
        <button class="w-full bg-red-gradient text-white px-4 py-2 rounded-lg mt-8">開始投票</button>
      </div>
    </div>
  </div>
</template>