import { ref } from 'vue';

/**
 * 獲取用戶當前位置的 Composable
 * 
 * @returns {Object} 當前位置相關的狀態和方法
 * @property {import('vue').Ref<boolean>} isLoading - 是否正在加載
 * @property {import('vue').Ref<boolean>} isError - 是否有錯誤
 * @property {import('vue').Ref<string>} errorMessage - 錯誤訊息
 * @property {import('vue').Ref<{latitude: number, longitude: number}|null>} position - 當前位置座標
 * @property {import('vue').Ref<Object|null>} addressInfo - 當前位置的地址資訊
 * @property {Function} getCurrentPosition - 獲取當前位置的方法
 * @property {Function} reset - 重置位置資訊
 * 
 * @example
 * // 在Vue元件中使用
 * import { useCurrentLocation } from '@/composables/maps/useCurrentLocation';
 * import { useToast } from '@/composables/useToast';
 * 
 * export default {
 *   setup() {
 *     const toast = useToast();
 *     const { 
 *       isLoading, 
 *       isError,
 *       errorMessage,
 *       position,
 *       addressInfo,
 *       getCurrentPosition 
 *     } = useCurrentLocation();
 *     
 *     const handleGetLocation = async () => {
 *       const success = await getCurrentPosition();
 *       if (!success) {
 *         toast.error(errorMessage.value);
 *       }
 *     };
 *     
 *     return { 
 *       isLoading, 
 *       addressInfo, 
 *       handleGetLocation 
 *     };
 *   }
 * }
 */
export function useCurrentLocation() {
  const isLoading = ref(false);
  const isError = ref(false);
  const errorMessage = ref('');
  const position = ref(null);
  const addressInfo = ref(null);

  // 重置所有狀態
  const reset = () => {
    position.value = null;
    addressInfo.value = null;
    isError.value = false;
    errorMessage.value = '';
  };

  // 獲取當前位置
  const getCurrentPosition = () => {
    return new Promise((resolve) => {
      // 檢查瀏覽器是否支持地理定位
      if (!navigator.geolocation) {
        isError.value = true;
        errorMessage.value = '您的瀏覽器不支援地理定位功能';
        resolve(false);
        return;
      }

      isLoading.value = true;
      isError.value = false;
      errorMessage.value = '';

      // 使用瀏覽器 API 獲取位置
      navigator.geolocation.getCurrentPosition(
        async (geoPosition) => {
          try {
            // 獲取經緯度
            const lat = geoPosition.coords.latitude;
            const lng = geoPosition.coords.longitude;
            
            position.value = {
              latitude: lat,
              longitude: lng
            };

            // 進行反向地理編碼（經緯度轉地址）
            const success = await reverseGeocode(lat, lng);
            isLoading.value = false;
            resolve(success);
          } catch (error) {
            console.error('獲取當前位置失敗:', error);
            isError.value = true;
            errorMessage.value = '獲取當前位置失敗';
            isLoading.value = false;
            resolve(false);
          }
        },
        (error) => {
          console.error('地理定位錯誤:', error);
          isLoading.value = false;
          isError.value = true;
          
          // 根據錯誤代碼設置適當的錯誤訊息
          switch (error.code) {
            case 1:
              errorMessage.value = '您已拒絕位置存取權限';
              break;
            case 2:
              errorMessage.value = '無法獲取位置信息，請檢查您的網絡連接';
              break;
            case 3:
              errorMessage.value = '位置請求超時，請稍後再試';
              break;
            default:
              errorMessage.value = '無法取得您的位置';
          }
          
          resolve(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );
    });
  };

  // 反向地理編碼：將經緯度轉換為地址
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // 設置地址資訊
        addressInfo.value = {
          placeId: data.results[0].place_id,
          formattedAddress: data.results[0].formatted_address,
          name: data.results[0].formatted_address,
          addressComponents: data.results[0].address_components
        };
        return true;
      } else {
        isError.value = true;
        errorMessage.value = '無法取得您的位置地址';
        return false;
      }
    } catch (error) {
      console.error('反向地理編碼失敗:', error);
      isError.value = true;
      errorMessage.value = '地址解析失敗';
      return false;
    }
  };

  return {
    isLoading,
    isError,
    errorMessage,
    position,
    addressInfo,
    getCurrentPosition,
    reset
  };
} 