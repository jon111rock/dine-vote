<script setup>
import { ref } from 'vue';
import OptionCard from './OptionCard.vue';

defineProps({
  options: {
    type: Array,
    required: true,
  },
});

const selectedValue = ref(null);

const handleSelect = (value) => {
  selectedValue.value = value;
};
</script>

<template>
  <p class="text-sm">1. 你偏好哪種主食 ?</p>
  <div class="grid grid-cols-2 mt-4 gap-3">
    <OptionCard 
      v-for="option in options" 
      :key="option.label" 
      :title="option.label" 
      :description="option.description" 
      :value="option.value"
      :isSelected="selectedValue === option.value"
      @select="handleSelect(option.value)"
    />
  </div>
</template>
