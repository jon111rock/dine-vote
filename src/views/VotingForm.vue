<script setup>
import OptionGroup from '../components/voting/OptionGroup.vue';

const options = [{
  label: '飯食',
  description: '米飯、燉飯、炒飯等',
  value: 'rice',
}, {
  label: '麵食',
  description: '義大利麵、炒麵等',
  value: 'noodle',
}, {
  label: '其他',
  description: '漢堡、三明治、披薩等',
  value: 'other',
}, {
  label: '沒意見',
  value: 'none',
}]
</script>

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
        <OptionGroup :options="options" />
      </div>
    </div>
  </div>
</template>
