<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { getRoomVotes } from '@/firebase/rooms';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// 狀態
const isLoading = ref(true);
const isApiLoading = ref(false);
const error = ref(null);
const roomId = ref('');
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

  // 獲取投票資料
  try {
    isLoading.value = true;
    const roomData = await getRoomVotes(roomId.value);

    console.log('房間投票資料:', roomData);
    votesData.value = roomData.votes || [];

    // 獲取餐廳推薦
    await fetchRecommendations(roomData);

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
</script>

<template>
  <div class="flex flex-col items-center min-h-screen pb-8">
    <!-- 加載畫面 -->
    <div v-if="isLoading" class="w-full max-w-md mt-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-500 mb-4"></div>
      <div class="bg-gray-50 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
        <p class="text-lg font-medium text-gray-800">正在分析投票結果</p>
        <p class="text-sm text-gray-600 mt-2">AI正在根據大家的投票進行餐廳推薦...</p>
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

    <!-- API加載中畫面 -->
    <div v-else-if="isApiLoading" class="w-full max-w-md mt-12 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-500 mb-4"></div>
      <div class="bg-gray-50 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
        <p class="text-lg font-medium text-gray-800">正在生成餐廳推薦</p>
        <p class="text-sm text-gray-600 mt-2">Gemini AI正在為您精選最適合的餐廳...</p>
        <div class="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div class="bg-red-500 h-2 rounded-full animate-pulse"></div>
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
        <!-- 餐廳縮圖 (可替換為實際圖片) -->
        <div class="h-[200px] w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center" @click="openGoogleMap(currentRecommendation.mapUrl)">
          <div class="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 22V12h6v10" />
            </svg>
            <p class="text-sm text-gray-600 mt-2">點擊查看地圖</p>
          </div>
        </div>

        <!-- 餐廳資訊 -->
        <div class="p-6">
          <!-- 餐廳名稱與評分 -->
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold">{{ currentRecommendation.name }}</span>
            <span v-if="currentRecommendation.rating" class="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span class="font-medium">{{ currentRecommendation.rating }}</span>
            </span>
          </div>

          <!-- 餐廳類型標籤 -->
          <div class="flex flex-wrap items-center gap-2 mt-3">
            <span v-for="(type, index) in currentRecommendation.type.split(',')" :key="index" class="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              {{ type.trim() }}
            </span>
            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              {{ currentRecommendation.priceRange }}
            </span>
          </div>

          <!-- 地址 -->
          <div class="flex items-center text-sm text-gray-600 mt-4 cursor-pointer" @click="openGoogleMap(currentRecommendation.mapUrl)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>{{ currentRecommendation.address }}</span>
          </div>

          <!-- 推薦理由 -->
          <div class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p class="text-sm font-bold text-gray-700">AI推薦理由：</p>
            <ul class="mt-2 text-sm text-gray-600 pl-5 list-disc space-y-1">
              <li v-for="(reason, index) in currentRecommendation.reasons" :key="index">
                {{ reason }}
              </li>
            </ul>
          </div>

          <!-- 推薦菜品 -->
          <div v-if="currentRecommendation.dishes && currentRecommendation.dishes.length" class="mt-4">
            <p class="text-sm font-bold text-gray-700">推薦菜品：</p>
            <div class="flex flex-wrap gap-2 mt-2">
              <span v-for="(dish, index) in currentRecommendation.dishes" :key="index" class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                {{ dish }}
              </span>
            </div>
          </div>

          <!-- 分頁指示器 -->
          <div v-if="totalRecommendations > 1" class="flex items-center justify-between mt-6">
            <button @click="showPreviousRecommendation" class="flex items-center text-gray-600 disabled:opacity-50" :disabled="currentRecommendationIndex === 0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              上一個
            </button>

            <div class="flex items-center space-x-2">
              <div v-for="(_, index) in recommendations" :key="index" :class="[
                'h-2 w-2 rounded-full',
                index === currentRecommendationIndex ? 'bg-red-500' : 'bg-gray-300'
              ]">
              </div>
            </div>

            <button @click="showNextRecommendation" class="flex items-center text-gray-600 disabled:opacity-50" :disabled="currentRecommendationIndex === totalRecommendations - 1">
              下一個
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- 分享按鈕 -->
          <button class="w-full bg-red-gradient text-white px-4 py-3 rounded-lg mt-6 flex items-center justify-center font-medium" @click="copyShareLink">
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
      <div v-if="analysisStats" class="px-6 pb-4 mt-4">
        <div class="p-4 rounded-lg bg-gray-50">
          <h3 class="text-sm font-bold text-gray-700">投票統計</h3>

          <div class="grid grid-cols-2 gap-4 mt-3">
            <div class="text-center p-2 bg-white rounded shadow-sm">
              <p class="text-xs text-gray-500">參與投票</p>
              <p class="text-lg font-bold text-indigo-600">{{ analysisStats.participantCount }}人</p>
            </div>

            <div class="text-center p-2 bg-white rounded shadow-sm">
              <p class="text-xs text-gray-500">平均預算</p>
              <p class="text-lg font-bold text-green-600">NT${{ Math.round(analysisStats.averageBudget) }}</p>
            </div>
          </div>

          <div v-if="analysisStats.topFoodTypes && analysisStats.topFoodTypes.length" class="mt-3">
            <p class="text-xs text-gray-500">最受歡迎類型</p>
            <div class="flex flex-wrap gap-2 mt-1">
              <div v-for="(type, index) in analysisStats.topFoodTypes" :key="index" class="flex items-center text-xs bg-white px-2 py-1 rounded shadow-sm">
                <span class="font-medium">{{ type.type }}</span>
                <span class="text-gray-500 ml-1">({{ Math.round(type.percentage) }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按鈕 -->
      <div class="flex flex-col items-center mt-4 px-6 pb-6">
        <p class="text-sm font-bold text-gray-700">滿意這個結果嗎?</p>
        <div class="flex items-center gap-3 mt-3 w-full">
          <button class="flex-1 bg-red-gradient text-white p-3 rounded-lg font-medium shadow-sm" @click="goToHome">
            滿意
          </button>
          <button class="flex-1 border border-gray-300 bg-white text-gray-700 p-3 rounded-lg font-medium shadow-sm" @click="restartVoting">
            重新投票
          </button>
        </div>
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