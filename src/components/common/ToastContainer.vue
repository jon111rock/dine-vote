<template>
  <!-- 只水平置中 -->
  <div class="fixed top-4 left-0 right-0 mx-auto flex justify-center z-50 pointer-events-none">
    <div class="w-full max-w-xs bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500 relative pointer-events-auto">
      <div class="flex gap-2">
        <!-- logo -->
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
        </div>
        <!-- text -->
        <div class="flex-grow">
          <p>成功建立房間！</p>
          <p class="text-sm text-gray-500">房間代碼：DV1234</p>
        </div>
        <!-- progress bar -->
        <div class="absolute bottom-0 left-0 w-full h-[2px] bg-green-500">
        </div>
      </div>
    </div>
  </div>
</template>