<script setup>
import LogoHeader from '@/components/common/LogoHeader.vue';
import DIcon from '@/components/common/DIcon.vue'
</script>

<template>
  <div class="w-full h-screen flex justify-center items-center">
    <div class="w-full max-w-md">
      <LogoHeader />
      <div class="bg-gray-100 rounded-xl shadow-lg p-8">
        <div class="flex justify-around text-gray-600">
          <button class="w-full border-b-2 border-b-orange-600 p-3 text-orange-600">登入</button>
          <button class="w-full border-b-1 border-b-gray-200 p-3">註冊</button>
        </div>
        <div class="mt-8 flex flex-col">
          <span class="text-sm">電子郵件</span>
          <input type="text" class="mt-1 border-1 bg-white border-gray-300 rounded-md p-3" placeholder="輸入您的電子郵件">
        </div>
        <div class="mt-8 flex flex-col">
          <div class="flex justify-between">
            <span class="text-sm">密碼</span>
            <span class="text-sm text-blue-800">忘記密碼?</span>
          </div>
          <input type="text" class="mt-1 border-1 bg-white border-gray-300 rounded-md p-3" placeholder="輸入您的電子郵件">
        </div>
        <div class="flex items-center gap-2 mt-4">
          <input type="checkbox" class="w-4 h-4">
          <span class="text-sm text-gray-600">記住我</span>
        </div>
        <div class="mt-6">
          <button class="w-full p-3 bg-red-gradient rounded-lg text-white">登入</button>
        </div>
        <div class="mt-6 flex items-center">
          <div class="flex-grow border-t border-t-gray-300"></div>
          <span class="text-sm text-gray-500 mx-3">或使用</span>
          <div class="flex-grow border-t border-t-gray-300"></div>
        </div>
        <div class="mt-6 flex items-center">
          <button class="flex items-center justify-center w-[250px] mx-auto border-1 border-gray-300 py-3 px-6 rounded-lg cursor-pointer bg-white">
          <DIcon type="google" :size="6"/>
            <span>Google</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
