// Vue 3
import { createStore } from 'vuex';

// Detecta base del API desde Vite o Vue CLI, con fallback local
const API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  process.env.VUE_APP_API_BASE ||
  'http://localhost/api';

export default createStore({
  state: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    authError: null,
    loading: false,
  },
  getters: {
    isAuthenticated: s => !!s.token,
    user: s => s.user,
    authError: s => s.authError,
    loading: s => s.loading,
  },
  mutations: {
    AUTH_START(state){ state.loading = true; state.authError = null; },
    AUTH_SUCCESS(state, { token, user }){
      state.loading = false;
      state.token = token;
      state.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    AUTH_FAILURE(state, msg){ state.loading = false; state.authError = msg; },
    LOGOUT(state){
      state.token = null;
      state.user = null;
      state.authError = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
  actions: {
    async login({ commit }, { email, password }){
      commit('AUTH_START');
      try {
        const res = await fetch(`${API}/auth/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || `Error de autenticación (${res.status})`);
        }
        commit('AUTH_SUCCESS', { token: data.token, user: data.user });
        return true;
      } catch (e) {
        commit('AUTH_FAILURE', e.message || 'Error de autenticación');
        return false;
      }
    },

    // Logout REAL: intenta invalidar el token en el backend y limpia siempre el estado
    async logout({ state, commit }){
      try {
        if (state.token) {
          await fetch(`${API}/auth/logout.php`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${state.token}` }
          });
        }
      } catch (_) {
        // Si falla la API igual limpiamos sesión
      } finally {
        commit('LOGOUT');
      }
    },

    // Valida el token guardado y refresca el usuario
    async fetchMe({ state, commit }){
      if (!state.token) return null;
      try {
        const res = await fetch(`${API}/auth/me.php`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          commit('AUTH_SUCCESS', { token: state.token, user: data.user });
          return data.user;
        }
        commit('LOGOUT');
        return null;
      } catch (_) {
        commit('LOGOUT');
        return null;
      }
    }
  }
});
