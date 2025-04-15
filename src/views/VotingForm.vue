<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage';
import { submitVote, watchRoomVotes } from '@/firebase/rooms';
import OptionGroup from '@/components/voting/OptionGroup.vue';
import BudgetSlider from '@/components/voting/BudgetSlider.vue';
import CommentInput from '@/components/voting/CommentInput.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const nicknameStorage = useNicknameStorage();

// 表單資料
const selectedFood = ref(null);
const selectedFlavor = ref(null);
const budget = ref(500);
const comment = ref('');

// 投票狀態
const isLoading = ref(false);
const isSubmitted = ref(false);
const error = ref(null);
const roomId = ref('');
const participantId = ref('');
const unsubscribe = ref(null);
const roomData = ref(null);
const votingStatus = ref({
  votes: [],
  totalParticipants: 0,
  votedParticipants: 0,
  allVoted: false,
  progress: 0
});

// 投票剩餘時間
const remainingTime = ref('--:--');
const timeIntervalId = ref(null);

// 表單驗證
const isFormValid = computed(() => {
  return selectedFood.value && selectedFlavor.value;
});

// 獲取表單數據
const getFormData = () => {
  return {
    food: selectedFood.value,
    flavor: selectedFlavor.value,
    budget: budget.value,
    comment: comment.value,
    timestamp: new Date().toISOString()
  };
};

// 提交投票
const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.error('請完成必選題目');
    return;
  }

  if (!roomId.value || !participantId.value) {
    toast.error('房間資訊不完整，請返回等待頁面');
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const voteData = getFormData();
    await submitVote(roomId.value, participantId.value, voteData);

    isSubmitted.value = true;
    toast.success('投票成功！等待其他人完成投票...');
  } catch (err) {
    console.error('投票提交失敗:', err);
    error.value = err.message || '投票提交失敗';
    toast.error(`投票提交失敗: ${error.value}`);
  } finally {
    isLoading.value = false;
  }
};

// 監聽房間投票狀態
const startWatchingVotes = () => {
  if (!roomId.value) return;

  unsubscribe.value = watchRoomVotes(roomId.value, (data) => {
    if (data.error) {
      error.value = data.error;
      toast.error(`監聽錯誤: ${data.error}`);
      return;
    }

    votingStatus.value = data;

    // 檢查是否當前用戶已投票
    const currentUserVote = data.votes.find(v => v.participantId === participantId.value);
    if (currentUserVote && currentUserVote.voteStatus === 'completed') {
      isSubmitted.value = true;
    }

    // 如果所有人都投票完成，跳轉到結果頁面
    if (data.allVoted && data.totalParticipants > 0) {
      toast.success('所有人都已完成投票！');
      setTimeout(() => {
        router.push(`/voting-result?roomId=${roomId.value}`);
      }, 1500);
    }
  });
};

// 頁面初始化
onMounted(() => {
  // 從URL獲取參數
  const urlRoomId = route.query.roomId;
  const urlParticipantId = route.query.participantId;

  if (!urlRoomId || !urlParticipantId) {
    // 嘗試從localStorage獲取
    const savedRoomId = localStorage.getItem('currentRoomId');
    const savedParticipantId = localStorage.getItem('currentParticipantId');

    if (!savedRoomId || !savedParticipantId) {
      toast.error('缺少必要參數，無法進行投票');
      router.push('/');
      return;
    }

    roomId.value = savedRoomId;
    participantId.value = savedParticipantId;
  } else {
    roomId.value = urlRoomId;
    participantId.value = urlParticipantId;

    // 保存到localStorage以便在頁面刷新時恢復
    localStorage.setItem('currentRoomId', urlRoomId);
    localStorage.setItem('currentParticipantId', urlParticipantId);
  }

  // 開始監聽投票狀態
  startWatchingVotes();

  // 模擬倒計時（實際應從服務器獲取）
  const endTime = new Date();
  endTime.setMinutes(endTime.getMinutes() + 15); // 假設15分鐘

  timeIntervalId.value = setInterval(() => {
    const now = new Date();
    const diff = endTime - now;

    if (diff <= 0) {
      clearInterval(timeIntervalId.value);
      remainingTime.value = '00:00';
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    remainingTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
});

// 清理資源
onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value();
  }

  if (timeIntervalId.value) {
    clearInterval(timeIntervalId.value);
  }
});

// 範例選項資料
const foodOptions = [{
  label: '飯食',
  description: '米飯、燉飯、炒飯等',
  value: 'rice',
}, {
  label: '麵食',
  description: '義大利麵、炒麵等',
  value: 'noodle',
}, {
  label: '其他',
  description: '漢堡、三明治、披薩等',
  value: 'other',
}, {
  label: '沒意見',
  value: 'none',
}]

const flavorOptions = [{
  label: '中式',
  description: '炒飯、炒麵、炒麵等',
  value: 'chinese',
}, {
  label: '西式',
  description: '義大利麵、披薩、漢堡等',
  value: 'western',
}, {
  label: '日式',
  description: '拉麵、壽司、丼飯等',
  value: 'japanese',
}, {
  label: '沒意見',
  value: 'none',
}]
</script>

<template>
  <div class="flex items-center flex-col">
    <div class="w-full max-w-md bg-gray-50 rounded-lg p-6 shadow-lg mt-4 mb-4">
      <div class="flex justify-between items-center gap-2">
        <h1 class="text-xl font-bold">晚餐吃什麼 ?</h1>
        <div class="flex flex-col items-center">
          <p class="text-sm text-gray-500">投票剩餘時間</p>
          <p class="text-xl text-indigo-600 font-bold">{{ remainingTime }}</p>
        </div>
      </div>

      <!-- 投票進度 -->
      <div class="mt-4 mb-6">
        <div class="flex justify-between text-sm mb-1">
          <span>投票進度</span>
          <span>{{ votingStatus.votedParticipants }}/{{ votingStatus.totalParticipants }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-green-600 h-2.5 rounded-full" :style="{ width: `${votingStatus.progress}%` }"></div>
        </div>
      </div>

      <!-- 表單內容 -->
      <div class="mt-4">
        <OptionGroup v-model="selectedFood" :options="foodOptions" title="1. 你想吃什麼類型 ?" :disabled="isSubmitted" />
      </div>
      <div class="mt-8">
        <OptionGroup v-model="selectedFlavor" :options="flavorOptions" title="2. 你偏好哪種口味 ?" :disabled="isSubmitted" />
      </div>
      <div class="mt-8">
        <BudgetSlider v-model="budget" title="3. 你的預算是 ?" :min="100" :max="1000" :step="10" :disabled="isSubmitted" />
      </div>
      <div class="mt-8">
        <CommentInput v-model="comment" :disabled="isSubmitted" />
      </div>

      <!-- 送出按鈕 -->
      <div class="mt-8">
        <button class="w-full bg-red-gradient text-white p-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" @click="handleSubmit" :disabled="isLoading || isSubmitted || !isFormValid">
          <span v-if="isLoading">處理中...</span>
          <span v-else-if="isSubmitted">已送出 - 等待其他人投票</span>
          <span v-else>送出</span>
        </button>
      </div>

      <!-- 投票狀態訊息 -->
      <div v-if="isSubmitted" class="mt-4 text-center text-green-600">
        您已完成投票，請等待其他成員完成投票。
      </div>
      <div v-if="error" class="mt-4 text-center text-red-600">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-red-gradient {
  background: linear-gradient(to right, #f43f5e, #ef4444);
}
</style>
