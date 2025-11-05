// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import store from '@/store'                
import HomeView from '@/views/HomeView.vue'
import Login from '@/views/Login.vue'
import GradosView from '@/components/GradosView.vue'
import SeccionesView from '@/components/SeccionesView.vue'
import UsuariosView from '@/views/UsuariosView.vue'

const routes = [

  {
    path: '/login',
    name: 'Login',
    component: Login
  },
 
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
 
  {
    path: '/grados',
    name: 'Grados',
    component: GradosView,
    meta: { requiresAuth: true }
  },
  {
    path: '/secciones',
    name: 'Secciones',
    component: SeccionesView,
    meta: { requiresAuth: true }
  },

  {
    path: '/usuarios',
    name: 'usuarios',
    component: UsuariosView,
    meta: { requiresAuth: true }
  },
 
  {
    path: '/:pathMatch(.*)*',
    redirect: to => {
      const isAuth = store.getters['auth/isAuthenticated']
      return isAuth ? { name: 'Home' } : { name: 'Login' }
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})


router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta?.requiresAuth)
  const isAuth = store.getters['auth/isAuthenticated']

  if (requiresAuth && !isAuth) {
  
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  if (to.name === 'Login' && isAuth) {
    return next({ name: 'Home' })
  }

  next()
})

export default router
