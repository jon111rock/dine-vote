<script setup>
import { ref } from 'vue';
import OptionGroup from '../components/voting/OptionGroup.vue';
import BudgetSlider from '../components/voting/BudgetSlider.vue';
import CommentInput from '../components/voting/CommentInput.vue';

const selectedFood = ref(null);
const selectedFlavor = ref(null);
const budget = ref(500);
const comment = ref('');

const foodOptions = [{
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

const flavorOptions = [{
  label: '中式',
  description: '炒飯、炒麵、炒麵等',
  value: 'chinese',
}, {
  label: '西式',
  description: '義大利麵、披薩、漢堡等',
  value: 'western',
}, {
  label: '日式',
  description: '拉麵、壽司、丼飯等',
  value: 'japanese',
}, {
  label: '沒意見',
  value: 'none',
}]
</script>

<template>
  <div class="flex items-center flex-col">
    <div class="w-full max-w-md bg-gray-50 rounded-lg p-6 shadow-lg mt-4 mb-4">
      <div class="flex justify-between items-center gap-2">
        <h1 class="text-xl font-bold">晚餐吃什麼 ?</h1>
        <div class="flex flex-col items-center">
          <p class="text-sm text-gray-500">投票剩餘時間</p>
          <p class="text-xl text-indigo-600 font-bold">12:45</p>
        </div>
      </div>
      <div class="mt-4">
        <OptionGroup v-model="selectedFood" :options="foodOptions" />
      </div>
      <div class="mt-8">
        <OptionGroup v-model="selectedFlavor" :options="flavorOptions" title="2. 你偏好哪種口味 ?" />
      </div>
      <div class="mt-8">
        <BudgetSlider 
          v-model="budget" 
          title="3. 你的預算是 ?" 
          :min="100" 
          :max="1000" 
          :step="10" 
        />
      </div>
      <div class="mt-8">
        <CommentInput v-model="comment" />
      </div>
      <div class="mt-8">
        <button class="w-full bg-red-gradient text-white p-2 rounded-md cursor-pointer">送出</button>
      </div>
    </div>
  </div>
</template>
