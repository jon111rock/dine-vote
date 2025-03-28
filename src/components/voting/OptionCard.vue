<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
    validator: (value) => value.length > 0
  },
  description: {
    type: String,
    default: '',
  },
  value: {
    type: [String, Number],
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
  <div class="bg-white rounded-lg p-4 shadow-sm cursor-pointer 
           transform transition-all duration-300 ease-in-out 
           hover:shadow-md hover:-translate-y-1" :class="{
            'selection': isSelected,
            'scale-105': isSelected
          }" @click="selectOption">
    <p class="text-sm">{{ title }}</p>
    <p class="text-xs text-gray-500 mt-2 whitespace-nowrap overflow-hidden">{{ description }}</p>
  </div>
</template>
