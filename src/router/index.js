import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';
import HomeView from '@/views/HomeView.vue';
import Login from '@/views/Login.vue';
import GradosView from '@/components/GradosView.vue';
import SeccionesView from '@/components/SeccionesView.vue';
import EstudiantesView from '@/components/EstudiantesView.vue';
import ProfesoresView from '@/components/ProfesoresView.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/grados', name: 'Grados', component: GradosView, meta: { requiresAuth: true } },
  { path: '/secciones', name: 'Secciones', component: SeccionesView, meta: { requiresAuth: true } },
  { path: '/estudiantes', name: 'Estudiantes', component: EstudiantesView, meta: { requiresAuth: true } },
  { path: '/profesores', name: 'Profesores', component: ProfesoresView, meta: { requiresAuth: true } },
];

const router = createRouter({
  // Si usas Vue CLI: process.env.BASE_URL está bien.
  // Si usas Vite, cambia por: createWebHistory(import.meta.env.BASE_URL)
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// Guard con restauración de sesión
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth);
  const isAuth = store.getters.isAuthenticated; // <-- sin 'auth/'

  if (requiresAuth) {
    if (isAuth) return next();

    // si hay token guardado, intenta validar contra el backend
    if (store.state.token) {
      const me = await store.dispatch('fetchMe');
      if (me) return next();
    }
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  if (to.name === 'Login' && isAuth) {
    return next({ name: 'Home' });
  }

  next();
});

export default router;
