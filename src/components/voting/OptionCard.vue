<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    required: true,
  },
  isSelected: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['select']);

const selectOption = () => {
  emit('select', props.value);
};
</script>
<template>
  <div class="bg-white rounded-lg p-4 shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:shadow-md" :class="{ 'selection': isSelected }" @click="selectOption">
    <p class="text-sm">{{ title }}</p>
    <p class="text-sm text-gray-500 mt-2">{{ description }}</p>
  </div>
</template>
