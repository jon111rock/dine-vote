<script setup>
import { onMounted, onUnmounted, ref } from 'vue'; // 添加 onUnmounted
import { useVotingHistory } from '@/composables/history/useVotingHistory';
import NavigationBack from '@/components/common/NavigationBack.vue';
// 引入可能需要的 Loading 元件等
// import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

const { historyList, isLoading, error, canLoadMore, loadHistory, resetHistory } = useVotingHistory();

// 引用滾動容器
const scrollContainerRef = ref(null);

// 組件掛載時加載第一頁歷史記錄
onMounted(() => {
  loadHistory();
  // 可以在這裡添加滾動監聽器，或者使用 Intersection Observer
  // window.addEventListener('scroll', handleScroll);
});

// 組件卸載時移除監聽器，並重置狀態（如果需要）
onUnmounted(() => {
  // window.removeEventListener('scroll', handleScroll);
  // 可選：離開頁面時重置歷史記錄狀態
  // resetHistory();
});

// 實現加載更多的邏輯
const loadMoreHistory = () => {
  if (canLoadMore.value && !isLoading.value) {
    loadHistory(true); // 傳入 true 表示加載更多
  }
};

// 滾動加載示例 (更推薦使用 Intersection Observer)
// const handleScroll = () => {
//   if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
//     loadMoreHistory();
//   }
// };

// 格式化時間戳 (可提取為工具函數)
const formatTimestamp = (isoString) => {
  if (!isoString) return '未知時間';
  try {
    return new Date(isoString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '無效日期';
  }
};
</script>

<template>
  <div ref="scrollContainerRef" class="flex items-center min-h-screen flex-col w-full py-8 px-4">
    <div class="w-full max-w-md">
      <NavigationBack/>
      <div class="max-w-3xl mx-auto"> <!-- 增加 pt 以避開固定導航 -->
        <div v-if="isLoading && historyList.length === 0" class="text-center py-10">
          <p>載入中...</p>
          <!-- <LoadingSpinner /> -->
        </div>
        <div v-else-if="error" class="text-center py-10 card-backdrop rounded-xl shadow-lg p-6 border border-red-200">
          <p class="text-red-600 font-medium mb-4">載入失敗：{{ error }}</p>
          <button @click="loadHistory()" class="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" style="background: linear-gradient(to right, #5E5CE6, #00B8D9);">
            重試
          </button>
        </div>
        <div v-else-if="historyList.length === 0" class="text-center py-16 card-backdrop rounded-xl shadow-lg p-6">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">尚無投票紀錄</h3>
          <p class="mt-1 text-sm text-gray-500">您參與過的投票將會顯示在這裡。</p>
        </div>
        <div v-else>
          <ul class="space-y-4">
            <li v-for="history in historyList" :key="history.id" class="card-backdrop rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div class="flex justify-between items-start mb-2 gap-4">
                <h3 class="font-semibold text-lg text-gray-800 truncate pr-2">{{ history.roomName }} (#{{ history.roomCode }})</h3>
                <span class="text-xs text-gray-500 whitespace-nowrap">{{ formatTimestamp(history.completedAt) }}</span>
              </div>
              <p class="text-sm text-gray-600 mb-1">地點：{{ history.location }}</p>
              <p class="text-sm text-gray-600 mb-3">參與人數：{{ history.participantCount }} 人</p>
              <!-- 顯示首個推薦餐廳 -->
              <div v-if="history.recommendations && history.recommendations.length > 0" class="bg-gray-50/70 p-3 rounded-lg border border-gray-200 mt-3">
                <p class="text-sm font-medium text-gray-700 mb-1">主要推薦：</p>
                <p class="text-sm text-indigo-700 font-medium">{{ history.recommendations[0].name }} ({{ history.recommendations[0].type }})</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ history.recommendations[0].address }}</p>
              </div>
              <div v-else class="text-sm text-gray-400 italic mt-3">無推薦結果</div>
            </li>
          </ul>
          <!-- 加載更多按鈕 -->
          <div v-if="canLoadMore && historyList.length > 0" class="text-center mt-8">
            <button @click="loadMoreHistory" :disabled="isLoading" class="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all transform hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:transform-none disabled:shadow-none" style="background: linear-gradient(to right, #FF8A80, #FF5252);">
              {{ isLoading ? '載入中...' : '載入更多' }}
            </button>
          </div>
          <div v-else-if="!canLoadMore && historyList.length > 0" class="text-center mt-8 text-gray-500 text-sm">
            已載入所有紀錄
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 使頁面本身可滾動，而不是 body */
.voting-history-page {
  min-height: 100vh;
  /* 確保頁面至少和視窗一樣高 */
}

.card-backdrop {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>