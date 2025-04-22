<script setup>
/**
 * LogoHeader 組件用於顯示 DineVote 的標題和副標題
 * 
 * 可選參數:
 * - size: 標題大小 'normal'(default) | 'large' | 'small'
 * - centered: 是否置中 (default: true)
 * - subtitle: 自定義副標題文本 (default: '一起決定今天吃什麼！')
 */

defineProps({
  size: {
    type: String,
    default: 'normal',
    validator: value => ['small', 'normal', 'large'].includes(value)
  },
  centered: {
    type: Boolean,
    default: true
  },
  subtitle: {
    type: String,
    default: '一起決定今天吃什麼！'
  }
})
</script>

<template>
  <div :class="[
    centered ? 'flex flex-col items-center' : '',
    'mb-6 sm:mb-8'
  ]">
    <h1 :class="[
      size === 'small' ? 'text-2xl sm:text-3xl' :
        size === 'large' ? 'text-4xl sm:text-5xl' :
          'text-3xl sm:text-4xl',
      'mb-2 text-logo-gradient font-medium'
    ]">DineVote</h1>
    <p class="text-gray-600 text-sm sm:text-base">{{ subtitle }}</p>
  </div>
</template>