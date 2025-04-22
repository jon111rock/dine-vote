<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import DIcon from '@/components/common/DIcon.vue'

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['logout'])

const router = useRouter()
const toast = useToast()
const nicknameStorage = useNicknameStorage()

const isOpen = ref(false)
const dropdownRef = ref(null)

// 計算用戶顯示名稱
const displayName = computed(() => {
  if (!props.user) return '用戶';
  return props.user.displayName || props.user.email || '用戶';
})

// 計算用戶首字母（用於頭像）
const userInitial = computed(() => {
  if (!props.user) return '?';
  if (props.user.displayName) return props.user.displayName.charAt(0).toUpperCase();
  if (props.user.email) return props.user.email.charAt(0).toUpperCase();
  return '?';
})

// 計算頭像背景顏色
const avatarBgColor = computed(() => {
  if (!props.user) return 'bg-gray-400';

  // 根據用戶ID或郵箱生成不同的顏色
  const colors = [
    'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-blue-500',
    'bg-teal-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'
  ];

  const hash = props.user.uid?.length || props.user.email?.length || 5;
  const index = hash % colors.length;

  return colors[index];
})

// 切換下拉選單
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
}

// 關閉下拉選單
const closeDropdown = () => {
  isOpen.value = false;
}

// 處理登出
const handleLogout = () => {
  closeDropdown();
  emit('logout');
}

// 處理個人資料
const goToProfile = () => {
  closeDropdown();
  // 如果有個人資料頁面，可以取消註釋下面一行
  // router.push('/profile');
  toast.info('個人資料功能開發中');
}

// 處理點擊外部關閉下拉選單
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
}

// 監聽點擊事件
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
})
</script>

<template>
  <div ref="dropdownRef" class="relative z-50">
    <!-- 用戶頭像按鈕 -->
    <button @click.stop="toggleDropdown" class="flex items-center space-x-2 focus:outline-none transition-all duration-200 rounded-full p-1">
      <!-- 如果有頭像則顯示頭像，否則顯示首字母頭像 -->
      <div v-if="user?.photoURL" class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
        <img :src="user.photoURL" alt="用戶頭像" class="w-full h-full object-cover" />
      </div>
      <div v-else :class="[avatarBgColor, 'w-8 h-8 rounded-full flex items-center justify-center text-white font-medium shadow-sm border-2 border-white']">
        {{ userInitial }}
      </div>

      <!-- 下拉指示箭頭 -->
      <svg :class="{ 'transform rotate-180': isOpen }" class="w-4 h-4 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- 下拉選單 -->
    <div v-if="isOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden backdrop-blur-md bg-white/95 animation-dropdown">
      <!-- 用戶資訊區塊 -->
      <div class="p-4 border-b border-gray-100">
        <p class="font-medium text-gray-800">{{ displayName }}</p>
        <p class="text-xs text-gray-500 truncate">{{ user?.email }}</p>
      </div>

      <!-- 選單項目 -->
      <div class="py-1">
        <!-- <button @click="goToProfile" class="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center transition-colors">
          <DIcon name="user" size="4" class="mr-2 text-gray-500" />
          <span>個人資料</span>
        </button> -->

        <button @click="handleLogout" class="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center transition-colors">
          <DIcon type="log-out" size="4" class="mr-2 text-red-500" />
          <span>登出</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animation-dropdown {
  animation: dropdownFade 0.2s ease-out;
  transform-origin: top right;
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>