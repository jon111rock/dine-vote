import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import CreateRoom from '../views/CreateRoom.vue';
import WaitingRoom from '../views/WaitingRoom.vue';
import VotingForm from '../views/VotingForm.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 