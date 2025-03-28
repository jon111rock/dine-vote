<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<template>
  <p class="text-sm">4. 其他建議</p>
  <textarea 
    class="w-full mt-2 p-2 rounded-md border border-gray-300 bg-white" 
    :value="modelValue" 
    @input="handleInput"
    placeholder="有特別想吃的餐廳或食物嗎 ?" 
    rows="3" 
  />
</template>