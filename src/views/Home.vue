<script setup>
// 主頁元件邏輯
</script>

<template>
  <div class="flex justify-center items-center h-screen flex-col">
    <div class="max-w-md w-full">
      <div class="flex flex-col items-center">
        <h1 class="text-4xl mb-2 text-logo-gradient font-medium">DineVote</h1>
        <p class="text-gray-600">一起決定今天吃什麼！</p>
      </div>
      <div class="bg-white p-8 rounded-xl shadow-lg mt-6">
        <p class="text-xl font-medium text-gray-700">設置您的暱稱</p>
        <div class="mt-4">
          <p class="text-sm text-gray-600 mb-1">暱稱</p>
          <input class="w-full border-2 border-gray-300 rounded-md p-3" type="text" placeholder="請輸入暱稱">
        </div>
        <button class="cursor-pointer w-full bg-red-gradient text-white rounded-md mt-4 py-3 px-4 ">儲存暱稱</button>
      </div>
      <div class="w-full mt-8 flex gap-4">
        <button class="w-1/2 bg-white  rounded-md p-2 py-3 shadow-md text-gray-700 font-medium">創建房間</button>
        <button class="w-1/2 bg-white  rounded-md p-2 py-3 shadow-md text-gray-700 font-medium">加入房間</button>
      </div>
    </div>
  </div>
</template>