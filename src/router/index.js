import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import CreateRoom from '@/views/CreateRoom.vue';
import WaitingRoom from '@/views/WaitingRoom.vue';
import VotingForm from '@/views/VotingForm.vue';
import VotingResult from '@/views/VotingResult.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import JoinRoom from '@/views/JoinRoom.vue';
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/create-room',
    name: 'CreateRoom',
    component: CreateRoom
  },
  {
    path: '/waiting-room',
    name: 'WaitingRoom',
    component: WaitingRoom
  },
  {
    path: '/voting-form',
    name: 'VotingForm',
    component: VotingForm
  },
  {
    path: '/voting-result',
    name: 'VotingResult',
    component: VotingResult
  },
  {
    path: '/join-room',
    name: 'JoinRoom',
    component: JoinRoom,
    props: (route) => ({
      roomCode: route.query.roomCode || ''
    })
  },
  {
    path: '/join',
    redirect: to => {
      // 將 /join?roomCode=XXXXXX 重定向到 /join-room?roomCode=XXXXXX
      return { path: '/join-room', query: { roomCode: to.query.roomCode } }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// 添加全局前置守衛
router.beforeEach((to, from, next) => {
  const nicknameStorage = useNicknameStorage();
  
  // 需要暱稱的頁面列表
  const requiresNickname = ['JoinRoom', 'WaitingRoom', 'VotingForm', 'VotingResult'];
  
  // 檢查是否需要暱稱且用戶沒有設置暱稱
  if (requiresNickname.includes(to.name) && !nicknameStorage.hasNickname()) {
    // 保存原始目標頁面信息
    const redirectInfo = {
      path: to.fullPath,
      roomCode: to.query.roomCode || to.query.code
    };
    
    // 保存到 sessionStorage，確保頁面刷新不丟失
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_AFTER_NICKNAME, JSON.stringify(redirectInfo));
    
    // 跳轉到首頁並帶上提示標記
    next({ 
      path: '/', 
      query: { 
        requireNickname: 'true',
        roomCode: redirectInfo.roomCode
      } 
    });
  } else {
    next();
  }
});

export default router; 