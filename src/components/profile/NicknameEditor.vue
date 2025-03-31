<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  showSaveButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:nickname', 'nickname-saved'])

// 初始化 toast 和暱稱存儲
const toast = useToast()
const nicknameStorage = useNicknameStorage()

// 輸入和顯示
const inputNickname = ref('')
const isEditing = ref(false)
const nicknameInput = ref(null) // 使用 ref 引用 DOM 元素

// 計算屬性
const hasNickname = computed(() => nicknameStorage.hasNickname())
const currentNickname = computed(() => nicknameStorage.nickname.value)

// 監聽暱稱變化
onMounted(() => {
  inputNickname.value = currentNickname.value
})

// 切換編輯模式
const toggleEditMode = () => {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    inputNickname.value = currentNickname.value
    // 使用 nextTick 確保 DOM 更新後再聚焦
    nextTick(() => {
      nicknameInput.value?.focus()
    })
  }
}

// 儲存暱稱
const saveNickname = () => {
  const trimmedNickname = inputNickname.value.trim()

  if (!trimmedNickname) {
    toast.error('暱稱不能為空', { title: '錯誤' })
    return
  }

  const success = nicknameStorage.saveNickname(trimmedNickname)

  if (success) {
    isEditing.value = false
    toast.success('暱稱已更新', { title: '成功' })
    emit('nickname-saved', trimmedNickname)
    emit('update:nickname', trimmedNickname)
  } else {
    toast.error('儲存失敗，請稍後再試', { title: '錯誤' })
  }
}

// 取消編輯
const cancelEdit = () => {
  isEditing.value = false
  inputNickname.value = currentNickname.value
}
</script>

<template>
  <div>
    <!-- 已設定暱稱且非編輯模式 -->
    <div v-if="hasNickname && !isEditing">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600 mb-2">您的暱稱</p>
        <button class="cursor-pointer flex items-center gap-1 hover:scale-105 transition-all duration-300" @click="toggleEditMode" aria-label="編輯暱稱">
          <span class="text-sm text-indigo-500 font-medium">編輯</span>
          <span class="text-indigo-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
          </span>
        </button>
      </div>
      <div class="bg-gray-100 rounded-md p-4 border-l-4 border-indigo-500 cursor-pointer" @click="toggleEditMode">
        <p>{{ currentNickname }}</p>
      </div>
    </div>

    <!-- 編輯模式 -->
    <div v-if="isEditing">
      <p class="text-sm text-gray-600 mb-2">編輯暱稱</p>
      <div class="mb-4">
        <input ref="nicknameInput" v-model="inputNickname" type="text" class="w-full border-2 border-gray-300 rounded-md p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="請輸入暱稱" @keyup.enter="saveNickname" @keyup.esc="cancelEdit">
      </div>
      <div class="flex gap-2">
        <button class="cursor-pointer flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md py-2 px-4 flex items-center justify-center gap-1 transition-colors" @click="saveNickname">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>儲存</span>
        </button>
        <button class="cursor-pointer flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md py-2 px-4 flex items-center justify-center gap-1 transition-colors" @click="cancelEdit">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>取消</span>
        </button>
      </div>
    </div>

    <!-- 未設定暱稱且非編輯模式 -->
    <div v-if="!hasNickname && !isEditing">
      <p class="text-sm text-gray-600 mb-2">暱稱</p>
      <div class="mb-4">
        <input ref="nicknameInput" v-model="inputNickname" type="text" class="w-full border-2 border-gray-300 rounded-md p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="請輸入暱稱" @keyup.enter="saveNickname">
      </div>
      <button v-if="showSaveButton" class="cursor-pointer w-full bg-gradient-to-r from-red-400 to-red-600 text-white rounded-md py-3 px-4 hover:from-red-500 hover:to-red-700 transition-all duration-300" @click="saveNickname">
        儲存暱稱
      </button>
    </div>
  </div>
</template>