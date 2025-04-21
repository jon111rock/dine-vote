<script setup>
import DIcon from "@/components/common/DIcon.vue"

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true,
    default: '標題'
  },
  message: {
    type: String,
    required: true,
    default: '訊息'
  }
})
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black/60" v-if="true">
    <div class="min-w-[300px] bg-white p-8 rounded-lg shadow-lg flex flex-col items-center gap-4">
      <DIcon type="info" size="12" />
      <h1 class="text-xl font-bold">{{ title }}</h1>
      <p class="text-gray-500">{{ message }}</p>
      <div class="flex gap-4 w-full">
        <button class="w-full border border-gray-300 px-4 py-2 rounded-md cursor-pointer">取消</button>
        <button class="w-full bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer">確定</button>
      </div>
    </div>
  </div>
</template>