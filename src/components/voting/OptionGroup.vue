<script setup>
import { ref } from 'vue';
import OptionCard from './OptionCard.vue';

const props = defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const selectedValue = ref(props.modelValue);

const handleSelect = (value) => {
  selectedValue.value = value;
  emit('update:modelValue', value);
  emit('change', value);
};
</script>

<template>
  <p class="text-sm">{{ title }}</p>
  <div class="grid grid-cols-2 mt-4 gap-3">
    <OptionCard v-for="option in options" :key="option.label" :title="option.label" :description="option.description" :value="option.value" :isSelected="selectedValue === option.value" @select="handleSelect(option.value)" />
  </div>
</template>
