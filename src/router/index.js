import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import CreateRoom from '@/views/CreateRoom.vue';
import WaitingRoom from '@/views/WaitingRoom.vue';
import VotingForm from '@/views/VotingForm.vue';
import VotingResult from '@/views/VotingResult.vue';
import JoinRoom from '@/views/JoinRoom.vue';
import Login from '@/views/Login.vue';
import { useNicknameStorage } from '@/composables/storage/useNicknameStorage';
import { STORAGE_KEYS } from '@/constants/storage-keys';
import { useAuth } from '@/composables/auth/useAuth';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// 判斷用戶是否已登入的函數
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      user => {
        unsubscribe();
        resolve(user);
      },
      err => {
        unsubscribe();
        reject(err);
      }
    );
  });
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true }
  },
  {
    path: '/create-room',
    name: 'CreateRoom',
    component: CreateRoom,
    meta: { requiresAuth: true }
  },
  {
    path: '/waiting-room',
    name: 'WaitingRoom',
    component: WaitingRoom,
    meta: { requiresAuth: true }
  },
  {
    path: '/voting-form',
    name: 'VotingForm',
    component: VotingForm,
    meta: { requiresAuth: true }
  },
  {
    path: '/voting-result',
    name: 'VotingResult',
    component: VotingResult,
    meta: { requiresAuth: true }
  },
  {
    path: '/join-room',
    name: 'JoinRoom',
    component: JoinRoom,
    props: (route) => ({
      roomCode: route.query.roomCode || ''
    }),
    meta: { requiresAuth: true }
  },
  {
    path: '/join',
    redirect: to => {
      // 將 /join?roomCode=XXXXXX 重定向到 /join-room?roomCode=XXXXXX
      return { path: '/join-room', query: { roomCode: to.query.roomCode } }
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
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
router.beforeEach(async (to, from, next) => {
  // 檢查是否需要身份驗證
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);
  
  try {
    // 獲取當前用戶
    const currentUser = await getCurrentUser();
    
    // 如果需要登入但未登入，重定向到登入頁面
    if (requiresAuth && !currentUser) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
      return;
    }
    
    // 如果需要訪客身份但已登入，重定向到首頁
    if (requiresGuest && currentUser) {
      next({ path: '/' });
      return;
    }
    
    // 如果已登入，開始檢查暱稱設置
    if (currentUser) {
      const nicknameStorage = useNicknameStorage();
      const requiresNickname = ['JoinRoom', 'WaitingRoom', 'VotingForm', 'VotingResult'];
      
      // 檢查是否需要暱稱且用戶沒有設置暱稱
      if (requiresNickname.includes(to.name) && !nicknameStorage.hasNickname()) {
        // 不再嘗試使用用戶顯示名稱作為暱稱
        // 由NicknameEditor組件使用defaultValue處理
        
        // 保存原始目標頁面資訊
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
        return;
      }
    }
    
    // 其他情況正常導航
    next();
  } catch (error) {
    console.error('路由守衛錯誤:', error);
    next('/login');
  }
});

export default router; 