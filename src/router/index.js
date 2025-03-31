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
    component: JoinRoom
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