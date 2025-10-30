import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import login from '@/views/Login.vue'
import GradosView from '@/components/GradosView.vue'
import SeccionesView from '@/components/SeccionesView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: login
  },
  {
    path: '/grados',
    name: 'Grados',
    component: GradosView
  },
  {
    path: '/secciones',
    name: 'Secciones',
    component: SeccionesView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
