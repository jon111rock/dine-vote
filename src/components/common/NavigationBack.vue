<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  backPath: {
    type: String,
    default: '/',
  },
});
const router = useRouter();
</script>

<template>
  <div class="py-5">
    <span class="text-blue-600 cursor-pointer" @click="router.back(backPath)">← 返回</span>
  </div>
</template>
