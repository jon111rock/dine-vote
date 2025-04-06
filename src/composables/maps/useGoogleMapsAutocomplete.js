import { Loader } from '@googlemaps/js-api-loader';
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Google Maps 地址自動完成 Composable
 * 
 * @param {import('vue').Ref<HTMLInputElement>} inputRef - 輸入框的ref引用
 * @param {Object} options - 自動完成選項
 * @param {Array<string>} [options.types] - 地點類型，預設為 ['establishment', 'geocode']
 * @param {Object} [options.componentRestrictions] - 地區限制，預設為 { country: 'tw' }
 * @returns {Object} 自動完成相關的狀態和方法
 * @property {import('vue').Ref<boolean>} isLoading - API載入狀態
 * @property {import('vue').Ref<boolean>} isError - 錯誤狀態
 * @property {import('vue').Ref<string>} errorMessage - 錯誤訊息
 * @property {import('vue').Ref<Object|null>} selectedPlace - 選擇的地點資訊
 * @property {import('vue').Ref<{latitude: number, longitude: number}|null>} selectedGeoPoint - 選擇地點的經緯度
 * @property {Function} reset - 重置所有狀態並清空輸入
 * @property {Function} getFirebaseGeoPoint - 獲取 Firebase GeoPoint 格式的資料
 * 
 * @example
 * // 在Vue元件中使用
 * import { ref } from 'vue';
 * import useGoogleMapsAutocomplete from '@/composables/maps/useGoogleMapsAutocomplete';
 * 
 * export default {
 *   setup() {
 *     const addressInputRef = ref(null);
 *     const { 
 *       isLoading, 
 *       isError, 
 *       errorMessage, 
 *       selectedPlace, 
 *       selectedGeoPoint, 
 *       reset,
 *       getFirebaseGeoPoint 
 *     } = useGoogleMapsAutocomplete(addressInputRef);
 *     
 *     const saveToFirebase = async () => {
 *       // 需先導入 Firebase 的 GeoPoint
 *       // import { GeoPoint } from 'firebase/firestore';
 *       
 *       await addDoc(collection(db, 'restaurants'), {
 *         name: restaurantName.value,
 *         address: selectedPlace.value.formattedAddress,
 *         location: getFirebaseGeoPoint() // 或手動創建: new GeoPoint(lat, lng)
 *       });
 *     };
 *     
 *     return { addressInputRef, selectedPlace, saveToFirebase, reset };
 *   }
 * }
 */
const useGoogleMapsAutocomplete = (inputRef, options = {}) => {
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  });

  const isLoading = ref(true);
  const isError = ref(false);
  const errorMessage = ref('');
  const selectedPlace = ref(null);
  const selectedGeoPoint = ref(null);
  let autocompleteInstance = null;

  // 初始化 Google Maps API
  const initGoogleMapsApi = async () => {
    try {
      isLoading.value = true;
      // 使用 importLibrary 代替已棄用的 load() 方法
      const { Autocomplete } = await loader.importLibrary('places');
      isLoading.value = false;
      return { Autocomplete };
    } catch (error) {
      console.error('Google Maps API 載入失敗:', error);
      isError.value = true;
      errorMessage.value = '無法載入地址服務，請稍後再試';
      isLoading.value = false;
      return null;
    }
  };

  // 實現自動完成功能
  const initAutocomplete = (Autocomplete) => {
    if (!inputRef.value || !Autocomplete) return;

    const autocompleteOptions = {
      types: options.types || ['establishment', 'geocode'],
      componentRestrictions: options.componentRestrictions || { country: 'tw' },
      fields: ['address_components', 'formatted_address', 'geometry', 'name', 'place_id'],
    };

    autocompleteInstance = new Autocomplete(
      inputRef.value,
      autocompleteOptions
    );

    // 處理地址選擇事件
    autocompleteInstance.addListener('place_changed', handlePlaceChanged);
  };

  const handlePlaceChanged = () => {
    const place = autocompleteInstance.getPlace();

    if (!place || !place.geometry || !place.geometry.location) {
      errorMessage.value = '無法獲取地址資訊，請選擇有效的地址';
      isError.value = true;
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    selectedPlace.value = {
      placeId: place.place_id,
      name: place.name || '',
      formattedAddress: place.formatted_address || '',
      addressComponents: place.address_components || [],
    };

    selectedGeoPoint.value = {
      latitude: lat,
      longitude: lng,
    };

    isError.value = false;
    errorMessage.value = '';
  };

  // 清除和重置功能
  const reset = () => {
    if (inputRef.value) {
      inputRef.value.value = '';
    }
    selectedPlace.value = null;
    selectedGeoPoint.value = null;
    isError.value = false;
    errorMessage.value = '';
  };

  // 生命週期鉤子
  onMounted(async () => {
    const result = await initGoogleMapsApi();
    if (result && inputRef.value) {
      initAutocomplete(result.Autocomplete);
    }
  });

  onUnmounted(() => {
    if (autocompleteInstance && google) {
      google.maps.event.clearInstanceListeners(autocompleteInstance);
    }
  });

  // 返回必要的數據和方法
  return {
    isLoading,
    isError,
    errorMessage,
    selectedPlace,
    selectedGeoPoint,
    reset,
    // 提供將GeoPoint轉換為Firebase格式的方法
    getFirebaseGeoPoint: () => {
      if (!selectedGeoPoint.value) return null;
      // 注意: 實際使用時需導入Firebase的GeoPoint
      // return new firebase.firestore.GeoPoint(selectedGeoPoint.value.latitude, selectedGeoPoint.value.longitude);
      return selectedGeoPoint.value; // 返回原始格式，實際使用時可轉換
    }
  };
};

export default useGoogleMapsAutocomplete;
