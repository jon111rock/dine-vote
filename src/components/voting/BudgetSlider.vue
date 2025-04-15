<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  modelValue: {
    type: Number,
    required: true
  },
  min: {
    type: Number,
    default: 100
  },
  max: {
    type: Number,
    default: 1000
  },
  step: {
    type: Number,
    default: 10
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const handleInput = (event) => {
  if (props.disabled) return;

  const value = Number(event.target.value);
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<template>
  <div>
    <p class="text-sm">{{ title }}</p>
    <div class="flex items-center justify-between mt-2">
      <span class="text-lg font-semibold">${{ modelValue }}</span>
    </div>
    <input type="range" :min="min" :max="max" :step="step" :value="modelValue" :disabled="disabled" @input="handleInput" :class="[
      'w-full mt-2 h-2 appearance-none bg-gray-200 rounded-full',
      disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
    ]" />
    <div class="flex justify-between items-center mt-1">
      <span class="text-xs text-gray-600">${{ min }}</span>
      <span class="text-xs text-gray-600">${{ max / 2 }}</span>
      <span class="text-xs text-gray-600">${{ max }}</span>
    </div>
  </div>
</template>