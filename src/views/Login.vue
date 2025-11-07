<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="text-h6">Iniciar sesión</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="doLogin">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Correo"
                prepend-icon="mdi-email"
                required
                type="email"
                autocomplete="username"
              />
              <v-text-field
                v-model="password"
                :rules="passRules"
                label="Contraseña"
                prepend-icon="mdi-lock"
                :type="showPass ? 'text' : 'password'"
                :append-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="showPass = !showPass"
                required
                autocomplete="current-password"
              />
              <v-alert type="error" dense v-if="authError" class="mb-2">
                {{ authError }}
              </v-alert>
              <v-btn :loading="loading" :disabled="!valid || loading" type="submit" color="primary" block>
                Entrar
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'LoginView',
  data: () => ({
    email: '',
    password: '',
    showPass: false,
    valid: false,
    emailRules: [
      v => !!v || 'Correo requerido',
      v => /.+@.+\..+/.test(v) || 'Correo inválido'
    ],
    passRules: [v => !!v || 'Contraseña requerida']
  }),
  computed: {
    ...mapGetters(['authError', 'loading'])
  },
  methods: {
    async doLogin() {
      const ok = await this.$store.dispatch('login', {
        email: this.email.trim(),
        password: this.password
      });
      if (ok) {
        const redirect = this.$route.query.redirect || '/';
        this.$router.replace(redirect);
      }
    }
  }
};
</script>
