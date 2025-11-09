<template>
  <v-app-bar app color="blue darken-2" dark>
    <v-toolbar-title class="mr-10">
      <router-link to="/" class="text-decoration-none" style="color: white">
        Sistema de gestión escolar
      </router-link>
    </v-toolbar-title>

    <template v-if="isAuthenticated && !isLoginRoute">
      <v-btn text to="/grados" class="hidden-sm-and-down">Grados</v-btn>
      <v-btn text to="/secciones" class="hidden-sm-and-down">Secciones</v-btn>
      <v-btn text to="/especialidades" class="hidden-sm-and-down">Especialidades</v-btn>
      <v-btn text to="/asistencias" class="hidden-sm-and-down">Asistencias</v-btn>

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn text v-bind="props" class="hidden-sm-and-down">
            Usuarios <v-icon right>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item to="/estudiantes">
            <v-list-item-title>Estudiantes</v-list-item-title>
          </v-list-item>
          <v-list-item to="/profesores">
            <v-list-item-title>Profesores</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-btn
        v-if="isAdmin"
        text
        to="/admin/usuarios"
        class="hidden-sm-and-down"
      >
        Administrar usuarios
      </v-btn>

      <v-spacer />

      <v-menu offset-y>
        <template #activator="{ props }">
          <v-btn text v-bind="props">
            {{ userLabel }} <v-icon right>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title>Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'NavBar',
  computed: {
    ...mapGetters(['isAuthenticated', 'user']),
    isLoginRoute() { return this.$route.name === 'Login'; },
    isAdmin() {
      const r = (this.user?.rol || '').toLowerCase();
      return r === 'administrador' || r === 'admin';
    },
    userLabel() {
      if (this.user) {
        const rol = this.user.rol ? ` (${this.user.rol})` : '';
        return `${this.user.nombre}${rol}`;
      }
      return 'Usuario';
    }
  },
  methods: {
    async logout() {
      await this.$store.dispatch('logout');
      this.$router.push({ name: 'Login' });
    }
  }
};
</script>

<style scoped>
.text-decoration-none { text-decoration: none; }
</style>
