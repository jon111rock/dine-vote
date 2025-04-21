<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { getRoomVotes, getRecommendationResults } from '@/firebase/rooms';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// 狀態
const isLoading = ref(true);
const isApiLoading = ref(false);
const isWaitingForRecommendations = ref(false);
const error = ref(null);
const roomId = ref('');
const participantId = ref('');
const isRoomOwner = ref(false);
const votesData = ref([]);
const recommendations = ref([]);
const analysisStats = ref(null);

// 當前顯示的餐廳索引
const currentRecommendationIndex = ref(0);

// 計算當前顯示的餐廳
const currentRecommendation = computed(() =>
  recommendations.value && recommendations.value.length > 0
    ? recommendations.value[currentRecommendationIndex.value]
    : null
);

// 計算總推薦數量
const totalRecommendations = computed(() => recommendations.value?.length || 0);

// 顯示下一個推薦
const showNextRecommendation = () => {
  if (currentRecommendationIndex.value < recommendations.value.length - 1) {
    currentRecommendationIndex.value++;
  }
};

// 顯示上一個推薦
const showPreviousRecommendation = () => {
  if (currentRecommendationIndex.value > 0) {
    currentRecommendationIndex.value--;
  }
};

// 轉換格式化投票數據，適應API格式
const formatVotesForApi = (roomData) => {
  if (!roomData || !roomData.votes) return [];

  return roomData.votes
    .filter(vote => vote.voteData) // 只包含有投票資料的參與者
    .map(vote => ({
      participantId: vote.participantId,
      participantName: vote.userId || '匿名用戶',
      foodType: vote.voteData.flavor && vote.voteData.food
        ? `${vote.voteData.flavor}-${vote.voteData.food}`
        : (vote.voteData.flavor || vote.voteData.food || '未指定'),
      budget: vote.voteData.budget || 500,
      comments: vote.voteData.comment || ''
    }));
};

// 獲取餐廳推薦
const fetchRecommendations = async (roomData) => {
  try {
    isApiLoading.value = true;

    const apiUrl = import.meta.env.VITE_DINE_GENUS_API_URL || 'http://localhost:3000/api/v1';
    const formattedVotes = formatVotesForApi(roomData);

    if (formattedVotes.length === 0) {
      throw new Error('沒有有效的投票資料');
    }

    const response = await axios.post(`${apiUrl}/recommendations`, {
      roomId: roomId.value,
      votes: formattedVotes,
      options: {
        language: "zh-TW",
        budgetCurrency: "TWD",
        locationContext: roomData.addressData?.address || '台灣',
        maxResults: 3,
        includeReasons: true
      }
    }, {
      timeout: 15000 // 設置15秒超時
    });

    if (response.data && response.data.success) {
      recommendations.value = response.data.data.recommendations || [];
      analysisStats.value = response.data.data.analysisStats || null;
      console.log('API回應成功:', response.data);

    } else {
      throw new Error(response.data?.error?.message || '獲取推薦失敗');
    }

  } catch (err) {
    console.error('API回應失敗:', err);
    error.value = err.message;
    toast.error(`獲取餐廳推薦失敗: ${err.message}`);
  } finally {
    isApiLoading.value = false;
  }
};

// 定時檢查是否有推薦結果
const checkForRecommendations = async () => {
  try {
    console.log('檢查是否有推薦結果...');
    const results = await getRecommendationResults(roomId.value);

    if (results) {
      console.log('已獲取推薦結果:', results);
      recommendations.value = results.data.recommendations || [];
      analysisStats.value = results.data.analysisStats || null;
      isWaitingForRecommendations.value = false;
      return true;
    }
    return false;
  } catch (err) {
    console.error('檢查推薦結果失敗:', err);
    return false;
  }
};

// 等待房主生成推薦結果
const waitForRecommendations = async () => {
  isWaitingForRecommendations.value = true;

  // 立即檢查一次
  if (await checkForRecommendations()) {
    return;
  }

  // 設置輪詢間隔 (每5秒檢查一次)
  const intervalId = setInterval(async () => {
    if (await checkForRecommendations()) {
      clearInterval(intervalId);
    }
  }, 5000);

  // 設置超時 (60秒後停止等待)
  setTimeout(() => {
    if (isWaitingForRecommendations.value) {
      clearInterval(intervalId);
      isWaitingForRecommendations.value = false;
      error.value = '等待推薦結果超時，請稍後重試';
    }
  }, 60000);
};

// 頁面初始化
onMounted(async () => {
  // 從URL獲取房間ID
  const urlRoomId = route.query.roomId;
  if (!urlRoomId) {
    // 嘗試從localStorage獲取
    const savedRoomId = localStorage.getItem('currentRoomId');
    if (!savedRoomId) {
      toast.error('無法獲取房間資訊');
      router.push('/');
      return;
    }
    roomId.value = savedRoomId;
  } else {
    roomId.value = urlRoomId;
  }

  // 獲取參與者ID
  const savedParticipantId = localStorage.getItem('currentParticipantId');
  if (savedParticipantId) {
    participantId.value = savedParticipantId;
  }

  // 獲取投票資料
  try {
    isLoading.value = true;
    const roomData = await getRoomVotes(roomId.value);

    console.log('房間投票資料:', roomData);
    votesData.value = roomData.votes || [];

    // 確定當前用戶是否為房主
    if (participantId.value && roomData.votes) {
      const currentUserData = roomData.votes.find(v => v.participantId === participantId.value);
      isRoomOwner.value = currentUserData?.isOwner === true;
      console.log('當前用戶是否為房主:', isRoomOwner.value);
    }

    // 檢查是否已有推薦結果
    const existingResults = await getRecommendationResults(roomId.value);
    if (existingResults) {
      console.log('已有推薦結果:', existingResults);
      recommendations.value = existingResults.data.recommendations || [];
      analysisStats.value = existingResults.data.analysisStats || null;
    } else {
      // 如果沒有結果，且是房主，則發起API請求
      if (isRoomOwner.value) {
        console.log('作為房主發起API請求...');
        await fetchRecommendations(roomData);
      } else {
        // 不是房主，等待結果
        console.log('非房主，等待推薦結果...');
        waitForRecommendations();
      }
    }

  } catch (err) {
    console.error('獲取投票資料失敗:', err);
    error.value = err.message;
    toast.error(`獲取投票資料失敗: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
});

// 返回首頁
const goToHome = () => {
  router.push('/');
};

// 重新投票
const restartVoting = () => {
  router.push(`/waiting-room?roomId=${roomId.value}`);
};

// 複製分享連結
const copyShareLink = () => {
  const link = `${window.location.origin}/voting-result?roomId=${roomId.value}`;
  navigator.clipboard.writeText(link)
    .then(() => {
      toast.success('已複製分享連結');
    })
    .catch(err => {
      console.error('複製失敗:', err);
      toast.error('複製失敗');
    });
};

// 打開Google地圖
const openGoogleMap = (mapUrl) => {
  if (mapUrl) {
    window.open(mapUrl, '_blank');
  }
};

// 新增下面的方法到script部分
// 在 isRoomOwner 和 votesData 之後新增
const restaurantImage = ref(null);

// 處理圖片載入錯誤
const handleImageError = (e) => {
  // 設置一個預設圖片
  e.target.src = '/images/default-restaurant.jpg';
  // 如果預設圖片也無法載入，顯示預設UI
  e.target.onerror = () => {
    if (restaurantImage.value) {
      restaurantImage.value.style.display = 'none';
    }
  };
};
</script>

<template>
  <div class="flex flex-col items-center min-h-screen pb-8">
    <!-- 加載畫面 -->
    <div v-if="isLoading" class="w-full max-w-md mt-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mb-4"></div>
      <div class="bg-gray-50 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
        <p class="text-lg font-medium text-gray-800">正在分析投票結果</p>
        <p class="text-sm text-gray-600 mt-2">正在獲取投票數據...</p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div class="bg-red-500 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 錯誤畫面 -->
    <div v-else-if="error" class="w-full max-w-md bg-gray-50 rounded-lg p-6 shadow-lg mt-8">
      <div class="flex items-center justify-center text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p class="text-center text-red-600 font-medium">{{ error }}</p>
      <div class="flex justify-center mt-6">
        <button @click="goToHome" class="bg-red-gradient text-white px-6 py-2 rounded-lg cursor-pointer">
          返回首頁
        </button>
      </div>
    </div>

    <!-- API加載中畫面 (房主) -->
    <div v-else-if="isApiLoading" class="w-full max-w-md mt-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500 mb-4"></div>
      <div class="bg-gray-50 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
        <p class="text-lg font-medium text-gray-800">正在生成餐廳推薦</p>
        <p class="text-sm text-gray-600 mt-2">AI正在為您精選最適合的餐廳...</p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div class="bg-red-500 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- 等待房主生成推薦結果 (非房主) -->
    <div v-else-if="isWaitingForRecommendations" class="w-full max-w-md mt-12 flex flex-col items-center justify-center">
      <div class="animate-pulse bg-gray-50 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
        <div class="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-lg font-medium text-gray-800">等待餐廳推薦結果</p>
        <p class="text-sm text-gray-600 mt-2">AI正在為大家獲取餐廳推薦，請稍候...</p>
        <div class="mt-6 flex flex-col items-center">
          <div class="flex space-x-2">
            <div class="h-2 w-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="h-2 w-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            <div class="h-2 w-2 bg-amber-500 rounded-full animate-bounce" style="animation-delay: 0.6s"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 結果畫面 -->
    <div v-else class="w-full max-w-md bg-white rounded-lg shadow-lg mt-8 overflow-hidden">
      <!-- 頭部 -->
      <div class="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
        <div class="flex flex-col items-center gap-2">
          <h1 class="text-2xl font-bold">決定了！</h1>
          <p class="text-sm">根據{{ votesData.length }}位成員的投票結果</p>
        </div>
      </div>

      <!-- 推薦餐廳 -->
      <div v-if="currentRecommendation" class="pb-4">
        <!-- 餐廳照片 -->
        <div class="relative">
          <div class="h-[250px] w-full relative overflow-hidden group" @click="openGoogleMap(currentRecommendation.mapUrl)">
            <img v-if="currentRecommendation.photoUrl" :src="currentRecommendation.photoUrl" :alt="currentRecommendation.name" class="w-full h-full object-cover cursor-pointer transition-all duration-300 group-hover:scale-105" @error="handleImageError" ref="restaurantImage" />
            <div v-else class="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <div class="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 22V12h6v10" />
                </svg>
                <p class="text-sm text-gray-500 mt-2">暫無照片</p>
              </div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-sm font-medium">點擊查看地圖位置</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 餐廳資訊 -->
        <div class="p-6">
          <!-- 餐廳名稱與評分 -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-900">{{ currentRecommendation.name }}</h3>
            </div>
          </div>

          <!-- 餐廳類型標籤 -->
          <div class="flex flex-wrap items-center gap-2 mt-4">
            <span v-for="(type, index) in currentRecommendation.type.split(',')" :key="index" class="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
              {{ type.trim() }}
            </span>
            <span class="text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-100">
              {{ currentRecommendation.priceRange }}
            </span>
          </div>

          <!-- 地址 -->
          <div class="flex items-center text-sm text-gray-600 mt-4 hover:text-gray-900 transition-colors duration-200 cursor-pointer" @click="openGoogleMap(currentRecommendation.mapUrl)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="hover:underline">{{ currentRecommendation.address }}</span>
          </div>

          <!-- 推薦理由 -->
          <div class="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p class="text-sm font-bold text-gray-800 mb-3">AI推薦理由</p>
            <ul class="space-y-2">
              <li v-for="(reason, index) in currentRecommendation.reasons" :key="index" class="flex items-start gap-2 text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ reason }}</span>
              </li>
            </ul>
          </div>

          <!-- 推薦菜品 -->
          <div v-if="currentRecommendation.dishes && currentRecommendation.dishes.length" class="mt-6">
            <p class="text-sm font-bold text-gray-800 mb-3">推薦菜品</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="(dish, index) in currentRecommendation.dishes" :key="index" class="text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100 hover:bg-green-100 transition-colors duration-200">
                {{ dish }}
              </span>
            </div>
          </div>

          <!-- 分頁指示器 -->
          <div v-if="totalRecommendations > 1" class="flex items-center justify-between mt-8">
            <button @click="showPreviousRecommendation" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" :disabled="currentRecommendationIndex === 0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              上一個
            </button>

            <div class="flex items-center gap-2">
              <div v-for="(_, index) in recommendations" :key="index" :class="[
                'h-2 w-2 rounded-full transition-all duration-200',
                index === currentRecommendationIndex
                  ? 'bg-red-500 w-4'
                  : 'bg-gray-300 hover:bg-gray-400'
              ]">
              </div>
            </div>

            <button @click="showNextRecommendation" class="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" :disabled="currentRecommendationIndex === totalRecommendations - 1">
              下一個
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- 分享按鈕 -->
          <button class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3.5 rounded-xl mt-6 flex items-center justify-center font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/25" @click="copyShareLink">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            複製分享連結
          </button>
        </div>
      </div>

      <!-- 沒有推薦的提示 -->
      <div v-else class="p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 mt-4">無法獲取餐廳推薦</p>
        <p class="text-gray-500 text-sm mt-2">請稍後再試或選擇重新投票</p>
      </div>

      <!-- 統計摘要 -->
      <div v-if="analysisStats" class="px-6 pb-6 mt-6">
        <div class="p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <h3 class="text-sm font-bold text-gray-900 mb-4">投票統計</h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-gray-500">參與投票</p>
                  <p class="text-xl font-bold text-indigo-600 mt-1">{{ analysisStats.participantCount }}人</p>
                </div>
                <div class="p-2 bg-indigo-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs text-gray-500">平均預算</p>
                  <p class="text-xl font-bold text-green-600 mt-1">NT${{ Math.round(analysisStats.averageBudget) }}</p>
                </div>
                <div class="p-2 bg-green-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div v-if="analysisStats.topFoodTypes && analysisStats.topFoodTypes.length" class="mt-4">
            <p class="text-xs text-gray-500 mb-2">最受歡迎類型</p>
            <div class="flex flex-wrap gap-2">
              <div v-for="(type, index) in analysisStats.topFoodTypes" :key="index" class="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ type.type }}</p>
                  <div class="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                    <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: `${type.percentage}%` }"></div>
                  </div>
                </div>
                <span class="text-xs font-medium text-gray-500">{{ Math.round(type.percentage) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 返回首頁按鈕 -->
      <div class="px-6 pb-6">
        <button @click="goToHome" class="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3.5 rounded-xl font-medium shadow-lg shadow-red-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首頁
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-red-gradient {
  background: linear-gradient(to right, #f43f5e, #ef4444);
}

.min-h-screen {
  min-height: 100vh;
}
</style>