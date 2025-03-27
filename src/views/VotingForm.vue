<template>
  <div class="flex items-center h-screen flex-col">
    <div class="w-full max-w-md bg-gray-50 rounded-lg p-8 shadow-lg mt-4">
      <div class="flex justify-between items-center gap-2">
        <h1 class="text-xl font-bold">晚餐吃什麼 ?</h1>
        <div class="flex flex-col items-center">
          <p class="text-sm text-gray-500">投票剩餘時間</p>
          <p class="text-xl text-indigo-600 font-bold">12:45</p>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-sm">1. 你偏好哪種主食 ?</p>
        <div class="grid grid-cols-2 mt-4 gap-3">
          <div class="bg-white rounded-lg p-4 shadow-sm selection">
            <p class="text-sm">飯食</p>
            <p class="text-sm text-gray-500 mt-2">米飯、燉飯、炒飯等</p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="text-sm">麵食</p>
            <p class="text-sm text-gray-500 mt-2">義大利麵、炒麵等</p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="text-sm">其他</p>
            <p class="text-sm text-gray-500 mt-2">漢堡、三明治、披薩等</p>
          </div>
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="text-sm">沒意見</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

