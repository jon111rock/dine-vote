<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage'
import { createRoom } from '@/firebase/rooms'
import NavigationBack from '@/components/common/NavigationBack.vue'
import { useToast } from '@/composables/useToast'
import useGoogleMapsAutocomplete from '@/composables/maps/useGoogleMapsAutocomplete'

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

// 取得當前位置
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    toast.error('您的瀏覽器不支援地理定位功能')
    return
  }

  isLoading.value = true
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        // 取得經緯度
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // 用經緯度反查地址 (反向地理編碼)
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        )
        const data = await response.json()

        if (data.status === 'OK' && data.results.length > 0) {
          // 設定地址
          if (locationInput.value) {
            locationInput.value.value = data.results[0].formatted_address
          }

          // 儲存經緯度資訊
          selectedGeoPoint.value = {
            latitude: lat,
            longitude: lng
          }

          // 儲存地址詳細資訊
          selectedPlace.value = {
            placeId: data.results[0].place_id,
            formattedAddress: data.results[0].formatted_address,
            name: data.results[0].formatted_address,
            addressComponents: data.results[0].address_components
          }
        } else {
          toast.error('無法取得您的位置地址')
        }
      } catch (error) {
        console.error('獲取當前位置失敗:', error)
        toast.error('獲取當前位置失敗')
      } finally {
        isLoading.value = false
      }
    },
    (error) => {
      console.error('地理定位錯誤:', error)
      isLoading.value = false

      let errorMsg = '無法取得您的位置'
      if (error.code === 1) {
        errorMsg = '您已拒絕位置存取權限'
      } else if (error.code === 2) {
        errorMsg = '無法獲取位置信息，請檢查您的網絡連接'
      } else if (error.code === 3) {
        errorMsg = '位置請求超時，請稍後再試'
      }

      toast.error(errorMsg)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
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
          <div class="flex items-center mt-2 gap-1 text-blue-600 text-sm cursor-pointer" @click="getCurrentLocation" :class="{ 'opacity-50 pointer-events-none': isLoading }">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
              </svg>
            </span>
            <span>{{ isLoading ? '取得位置中...' : '使用我的當前位置' }}</span>
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
          <button @click="handleCreateRoom" :disabled="isLoading" class="w-full bg-red-gradient text-white py-3 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {{ isLoading ? '創建中...' : '創建房間' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
