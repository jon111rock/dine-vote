<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  backPath: {
    type: String,
    default: '/',
  },
  text: {
    type: String,
    default: '← 返回',
  },
  isCustomAction: {
    type: Boolean,
    default: false,
  }
});

const emit = defineEmits(['custom-action']);

const router = useRouter();

const handleClick = () => {
  if (props.isCustomAction) {
    emit('custom-action');
  } else {
    router.back(props.backPath);
  }
};
</script>

<template>
  <div class="py-5">
    <span class="text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" @click="handleClick">
      {{ text }}
    </span>
  </div>
</template>
