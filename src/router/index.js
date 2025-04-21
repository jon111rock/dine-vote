import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import CreateRoom from '@/views/CreateRoom.vue';
import WaitingRoom from '@/views/WaitingRoom.vue';
import VotingForm from '@/views/VotingForm.vue';
import VotingResult from '@/views/VotingResult.vue';
import ToastContainer from '@/components/common/ToastContainer.vue';
import JoinRoom from '@/views/JoinRoom.vue';

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

export default router; 