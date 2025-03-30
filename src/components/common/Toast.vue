<script setup>
import { computed, onMounted, ref } from 'vue'
import { TOAST_TYPES } from '@/stores/toast.js'

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    default: TOAST_TYPES.INFO,
    validator: (value) => Object.values(TOAST_TYPES).includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])

const closeToast = () => {
  emit('close', props.id)
}

// 根據類型計算樣式
const typeClass = computed(() => {
  switch (props.type) {
    case TOAST_TYPES.SUCCESS:
      return 'border-green-500'
    case TOAST_TYPES.ERROR:
      return 'border-red-500'
    case TOAST_TYPES.WARNING:
      return 'border-yellow-500'
    case TOAST_TYPES.INFO:
    default:
      return 'border-blue-500'
  }
})

const iconClass = computed(() => {
  switch (props.type) {
    case TOAST_TYPES.SUCCESS:
      return 'text-green-500'
    case TOAST_TYPES.ERROR:
      return 'text-red-500'
    case TOAST_TYPES.WARNING:
      return 'text-yellow-500'
    case TOAST_TYPES.INFO:
    default:
      return 'text-blue-500'
  }
})

const progressBarClass = computed(() => {
  switch (props.type) {
    case TOAST_TYPES.SUCCESS:
      return 'bg-green-500'
    case TOAST_TYPES.ERROR:
      return 'bg-red-500'
    case TOAST_TYPES.WARNING:
      return 'bg-yellow-500'
    case TOAST_TYPES.INFO:
    default:
      return 'bg-blue-500'
  }
})

// 進度條寬度狀態，0-100%
const progressWidth = ref('100%')

// 當組件掛載後，逐漸減少進度條寬度至0
onMounted(() => {
  if (props.duration > 0) {
    // 設定初始寬度為100%
    progressWidth.value = '100%'

    // 使用RAF替代setTimeout，更平滑
    requestAnimationFrame(() => {
      // 觸發重繪
      const forceReflow = document.body.offsetHeight
      // 設為0，啟用CSS過渡動畫
      progressWidth.value = '0%'
    })
  }
})
</script>

<template>
  <div class="w-full max-w-xs bg-white rounded-lg shadow-lg p-4 border-l-4 relative pointer-events-auto transition-all duration-300 ease-in-out transform" :class="typeClass">
    <div class="flex gap-2">
      <!-- 圖標 -->
      <div class="flex-shrink-0" :class="iconClass">
        <svg v-if="type === TOAST_TYPES.SUCCESS" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <svg v-else-if="type === TOAST_TYPES.ERROR" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <svg v-else-if="type === TOAST_TYPES.INFO" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd"></path>
        </svg>
        <svg v-else-if="type === TOAST_TYPES.WARNING" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <!-- 文字 -->
      <div class="flex-grow">
        <p class="font-medium text-gray-800">{{ title }}</p>
        <p class="text-sm text-gray-500">{{ message }}</p>
      </div>
      <!-- 關閉按鈕 -->
      <div class="flex-shrink-0 ml-3">
        <button @click="closeToast" class="text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    </div>
    <!-- 進度條 -->
    <div v-if="duration > 0" class="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden" :class="progressBarClass" :style="{
      width: progressWidth,
      transition: `width ${duration}ms linear`
    }">
    </div>
  </div>
</template>