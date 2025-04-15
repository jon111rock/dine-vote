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
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select']);

const selectOption = () => {
  if (props.disabled) return;
  emit('select', props.value);
};
</script>
<template>
  <div class="bg-white rounded-lg p-4 shadow-sm
           transform transition-all duration-300 ease-in-out" :class="{
            'selection': isSelected,
            'scale-105': isSelected,
            'cursor-pointer hover:shadow-md hover:-translate-y-1': !disabled,
            'opacity-70': disabled && !isSelected,
            'cursor-not-allowed': disabled
          }" @click="selectOption">
    <p class="text-sm">{{ title }}</p>
    <p class="text-xs text-gray-500 mt-2 whitespace-nowrap overflow-hidden">{{ description }}</p>
  </div>
</template>

<style scoped>
.selection {
  border: 2px solid #4f46e5;
  background-color: #f5f3ff;
}
</style>
