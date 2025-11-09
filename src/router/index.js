// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

import HomeView from '@/views/HomeView.vue';
import Login from '@/views/Login.vue';
import GradosView from '@/components/GradosView.vue';
import SeccionesView from '@/components/SeccionesView.vue';
import EstudiantesView from '@/components/EstudiantesView.vue';
import ProfesoresView from '@/components/ProfesoresView.vue';
import UsuariosAdminView from '@/views/UsuariosAdminView.vue';
import EspecialidadesView from '@/components/EspecialidadesView.vue';
import AsistenciasView from '@/components/AsistenciasView.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', name: 'Home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/grados', name: 'Grados', component: GradosView, meta: { requiresAuth: true } },
  { path: '/secciones', name: 'Secciones', component: SeccionesView, meta: { requiresAuth: true } },
  { path: '/especialidades', name: 'Especialidades', component: EspecialidadesView, meta: { requiresAuth: true } },
  { path: '/asistencias', name: 'Asistencias', component: AsistenciasView, meta: { requiresAuth: true } },
  { path: '/estudiantes', name: 'Estudiantes', component: EstudiantesView, meta: { requiresAuth: true } },
  { path: '/profesores', name: 'Profesores', component: ProfesoresView, meta: { requiresAuth: true } },
  { path: '/admin/usuarios', name: 'UsuariosAdmin', component: UsuariosAdminView,
    meta: { requiresAuth: true, adminOnly: true } },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth);
  const adminOnly    = to.matched.some(r => r.meta?.adminOnly);
  const isAuth = store.getters.isAuthenticated;

  let user = store.getters.user;

  if (requiresAuth && !isAuth) {
    if (store.state.token) {
      const me = await store.dispatch('fetchMe');
      if (me) user = me; else return next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  }

  if (adminOnly) {
    const role = (user?.rol || '').toString().trim().toLowerCase();
    if (role !== 'admin' && role !== 'administrador') {
      return next({ name: 'Home' });
    }
  }

  if (to.name === 'Login' && isAuth) return next({ name: 'Home' });

  next();
});

export default router;
