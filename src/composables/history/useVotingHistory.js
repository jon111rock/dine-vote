import { ref } from 'vue'; // 移除 reactive，因為沒有用到
import { getUserCompletedRooms } from '@/firebase/history'; // 確認路徑正確
import { useAuth } from '@/composables/auth/useAuth'; // 用於獲取當前用戶 ID

export function useVotingHistory() {
  const { user, initialize } = useAuth(); // 獲取響應式的 user ref

  const historyList = ref([]); // 儲存用戶的歷史記錄
  const isLoading = ref(false);
  const error = ref(null);
  const canLoadMore = ref(true); // 是否還有更多數據可以加載
  const lastVisibleDoc = ref(null); // 用於分頁

  const loadHistory = async (loadMore = false) => {
    await initialize();
    // 確保 user ref 已經從 useAuth 初始化完成
    if (!user.value) {
      console.warn("嘗試加載歷史記錄但用戶尚未初始化");
      // 可以選擇等待 user.value 可用，或顯示錯誤/提示
      // 暫時返回，避免後續 user.value.uid 出錯
      // error.value = '用戶信息加載中，請稍候';
      // isLoading.value = false; // 如果設置了 loading，需要重置
      return;
    }
    if (isLoading.value || (!canLoadMore.value && loadMore)) return; // 防止重複加載或加載完畢後再加載

    isLoading.value = true;
    error.value = null;

    if (!loadMore) {
      // 如果不是加載更多，則重置列表和分頁狀態
      historyList.value = [];
      lastVisibleDoc.value = null;
      canLoadMore.value = true;
    }

    try {
      // 從 Firebase 獲取下一批已完成的房間
      const { docs, lastDoc } = await getUserCompletedRooms(10, lastVisibleDoc.value);

      if (docs.length === 0 && !loadMore) {
        // 首次加載就沒有數據
        canLoadMore.value = false;
        historyList.value = []; // 確保列表為空
      } else if (docs.length === 0 && loadMore) {
        // 加載更多時沒有數據
        canLoadMore.value = false;
      } else {
        // 在前端過濾出當前用戶參與的房間
        const userHistoryDocs = docs.filter(doc => {
          const data = doc.data();
          // 添加更健壯的檢查
          return data && data.participants && typeof data.participants === 'object' && data.participants[user.value.uid];
        });

        // 提取所需數據並添加到 historyList
        const newHistoryItems = userHistoryDocs.map(doc => {
          const data = doc.data();
          // 提取推薦列表時增加檢查
          const recommendationsData = data.recommendations?.data?.recommendations;
          return {
            id: doc.id,
            roomName: data.name || '未命名房間',
            roomCode: data.roomCode,
            completedAt: data.recommendations?.meta?.timestamp, // 使用推薦時間戳作為完成時間
            location: data.location?.address || data.location?.name || '未知地點', // 假設 location 結構
            // 確保 recommendationsData 是陣列再 slice
            recommendations: Array.isArray(recommendationsData) ? recommendationsData.slice(0, 1) : [],
            participantCount: Object.keys(data.participants || {}).length,
          };
        });

        historyList.value = loadMore ? [...historyList.value, ...newHistoryItems] : newHistoryItems;
        lastVisibleDoc.value = lastDoc; // 更新最後可見文檔
        // 稍微修改判斷邏輯，如果返回數量小於請求數量，則認為沒有更多了
        canLoadMore.value = docs.length === 10;
      }
    } catch (err) {
      console.error("加載投票歷史失敗:", err);
      error.value = err.message || '加載歷史記錄失敗';
      canLoadMore.value = false; // 出錯時停止加載
    } finally {
      isLoading.value = false;
    }
  };

  // 添加一個重置函數，以便在用戶登出或切換時可以清空狀態
  const resetHistory = () => {
    historyList.value = [];
    isLoading.value = false;
    error.value = null;
    canLoadMore.value = true;
    lastVisibleDoc.value = null;
  };

  return {
    historyList,
    isLoading,
    error,
    canLoadMore,
    loadHistory,
    resetHistory, // 導出重置函數
  };
} 