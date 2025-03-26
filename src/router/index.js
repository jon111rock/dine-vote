import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import CreateRoom from '../views/CreateRoom.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 