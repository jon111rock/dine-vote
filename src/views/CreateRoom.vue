<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { createRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'
import useGoogleMapsAutocomplete from '@/composables/maps/useGoogleMapsAutocomplete'
import { useCurrentLocation } from '@/composables/maps/useCurrentLocation'

const router = useRouter()
const nicknameStorage = useNicknameStorage()
const toast = useToast()

const roomName = ref('')
const locationInput = ref(null)
const expiryTime = ref('30')
const isAnonymous = ref(false)
const isLoading = ref(false)

// 地址自動完成
const {
  isError: isLocationError,
  errorMessage: locationErrorMessage,
  selectedPlace,
  selectedGeoPoint,
  reset: resetLocation
} = useGoogleMapsAutocomplete(locationInput)

// 使用當前位置
const {
  isLoading: isLocationLoading,
  addressInfo,
  position,
  getCurrentPosition
} = useCurrentLocation()

// 取得當前位置並填入地址欄位
const handleGetCurrentLocation = async () => {
  // 如果已經在加載中，則不執行
  if (isLocationLoading.value || isLoading.value) return;

  isLoading.value = true;
  const success = await getCurrentPosition();

  if (success && addressInfo.value) {
    // 填入地址欄位
    if (locationInput.value) {
      locationInput.value.value = addressInfo.value.formattedAddress;
    }

    // 更新地點資訊到自動完成組件的狀態
    selectedGeoPoint.value = position.value;
    selectedPlace.value = addressInfo.value;
  } else {
    toast.error('無法取得您的位置');
  }

  isLoading.value = false;
}

const handleCreateRoom = async () => {
  if (!nicknameStorage.hasNickname()) {
    toast.error('請先設定暱稱')
    return
  }

  if (!roomName.value.trim()) {
    toast.error('請輸入房間名稱')
    return
  }

  try {
    isLoading.value = true
    const userId = nicknameStorage.nickname.value

    const roomData = {
      name: roomName.value.trim(),
      userId
    }

    // 加入地點資訊（如果有選擇地點）
    if (selectedPlace.value) {
      roomData.location = {
        address: selectedPlace.value.formattedAddress,
        name: selectedPlace.value.name,
        geopoint: selectedGeoPoint.value
      }
    } else if (locationInput.value && locationInput.value.value.trim()) {
      // 只有純文字地址，無經緯度
      roomData.location = {
        address: locationInput.value.value.trim()
      }
    }

    roomData.expiryTime = parseInt(expiryTime.value)
    roomData.isAnonymous = isAnonymous.value

    const room = await createRoom(roomData)
    router.push(`/waiting-room?roomId=${room.id}`)
  } catch (err) {
    console.error('創建房間失敗:', err)
    toast.error('創建房間失敗')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex items-center min-h-screen flex-col w-full py-8 px-4">
    <div class="w-full max-w-md">
      <NavigationBack backPath="/" />
      <div class="w-full bg-white rounded-lg p-8 shadow-lg">
        <div>
          <p class="text-2xl font-bold text-gray-700">創建房間</p>
        </div>
        <div class="mt-6">
          <p class="text-sm">房間名稱</p>
          <input v-model="roomName" type="text" class="w-full mt-2 border border-gray-300 rounded-lg p-3" placeholder="例如： 晚餐吃什麼?">
        </div>
        <div class="mt-6">
          <label for="location" class="text-sm">地點</label>
          <div class="relative mt-2">
            <input ref="locationInput" type="text" id="location" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" placeholder="輸入地點或使用我的當前位置">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </div>
          </div>
          <div v-if="isLocationError" class="mt-1 text-red-500 text-xs">
            {{ locationErrorMessage }}
          </div>
          <div v-if="selectedPlace" class="mt-1 text-green-600 text-xs">
            已選擇: {{ selectedPlace.formattedAddress }}
          </div>
          <div class="flex items-center mt-2 gap-1 text-blue-600 text-sm cursor-pointer" @click="handleGetCurrentLocation" :class="{ 'opacity-50 pointer-events-none': isLoading || isLocationLoading }">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </span>
            <span>{{ isLoading || isLocationLoading ? '取得位置中...' : '使用我的當前位置' }}</span>
          </div>
        </div>
        <div class="mt-6">
          <p class="text-sm">投票截止時間</p>
          <div class="mt-2">
            <select v-model="expiryTime" id="expiryTime" class="w-full p-3 border border-gray-300 rounded-lg">
              <option value="15">15分鐘</option>
              <option value="30">30分鐘</option>
              <option value="60">1小時</option>
              <option value="120">2小時</option>
              <option value="0">手動結束</option>
            </select>
          </div>
        </div>
        <div class="mt-6">
          <input v-model="isAnonymous" type="checkbox" id="isAnonymous" class="mr-2">
          <label for="isAnonymous" class="text-sm text-gray-600">匿名模式 (不顯示投票者)</label>
        </div>
        <div class="mt-6">
          <button :disabled="isLoading || !roomName.trim() || !selectedPlace" @click="handleCreateRoom" class="w-full bg-red-gradient text-white py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoading ? '創建中...' : '創建房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
