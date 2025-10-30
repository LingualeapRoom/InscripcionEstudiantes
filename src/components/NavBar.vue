<template>
  <v-app-bar app color="blue darken-2" dark>
    <v-toolbar-title class="mr-10">
      <router-link to="/" class="text-decoration-none" style="color: white">
        Sistema de gestión escolar
      </router-link>
    </v-toolbar-title>

    <v-btn text to="/grados" class="hidden-sm-and-down">
      Grados
    </v-btn>

    <v-btn text to="/asistencias" class="hidden-sm-and-down">
      Asistencias
    </v-btn>

    <v-btn text to="/secciones" class="hidden-sm-and-down">
      Secciones
    </v-btn>

    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          text
          v-bind="attrs"
          v-on="on"
          class="hidden-sm-and-down"
        >
          Usuarios <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item to="/usuarios/alumnos">
          <v-list-item-title>Alumnos</v-list-item-title>
        </v-list-item>
        <v-list-item to="/usuarios/profesores">
          <v-list-item-title>Profesores</v-list-item-title>
        </v-list-item>
        </v-list>
    </v-menu>

    <v-spacer></v-spacer>

    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          text
          v-bind="attrs"
          v-on="on"
        >
          admin (Administrador) <v-icon right>mdi-menu-down</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="logout">
          <v-list-item-title>Cerrar Sesión</v-list-item-title>
        </v-list-item>
        <v-list-item to="/perfil">
          <v-list-item-title>Mi Perfil</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script>
export default {
  name: 'NavBar',
  methods: {
    logout() {
      // Lógica para cerrar sesión (ej. en Vuex)
      console.log('Cerrar sesión');
      // this.$store.dispatch('auth/logout');
      // this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
/* Estilos opcionales para asegurar que el router-link no tenga subrayado */
.text-decoration-none {
  text-decoration: none;
}
</style>