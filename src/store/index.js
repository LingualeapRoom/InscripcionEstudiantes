// Vue 3
import { createStore } from 'vuex';

const API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  process.env.VUE_APP_API_BASE; // funciona con Vite o Vue CLI

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
      state.loading = false; state.token = token; state.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    AUTH_FAILURE(state, msg){ state.loading = false; state.authError = msg; },
    LOGOUT(state){
      state.token = null; state.user = null; state.authError = null;
      localStorage.removeItem('token'); localStorage.removeItem('user');
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
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Error de autenticación');
        commit('AUTH_SUCCESS', { token: data.token, user: data.user });
        return true;
      } catch (e) {
        commit('AUTH_FAILURE', e.message);
        return false;
      }
    },
    logout({ commit }){ commit('LOGOUT'); },
    async fetchMe({ state, commit }){
      if (!state.token) return null;
      const res = await fetch(`${API}/auth/me.php`, {
        headers: { Authorization: `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (data.ok) {
        commit('AUTH_SUCCESS', { token: state.token, user: data.user });
        return data.user;
      } else {
        commit('LOGOUT'); return null;
      }
    }
  }
});
