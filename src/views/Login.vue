<template>
  <div class="login-wrapper">
    <div class="login-card" role="main" aria-labelledby="login-title">
      <!-- Logo / Header -->
      <div class="login-header">
        <img v-if="logoSrc" :src="logoSrc" alt="Logo" class="logo" />
        <h2 id="login-title">Iniciar sesión</h2>
        <p class="muted">Accede con tu cuenta para continuar</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="onSubmit" novalidate class="login-form" :class="{ 'has-error': !!error }">
        <!-- Email -->
        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            required
            :class="{ invalid: emailInvalid }"
            @blur="validateEmail"
            placeholder="ej: usuario@dominio.com"
          />
          <small v-if="emailInvalid" class="input-help">Introduce un correo válido</small>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="password-row">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              :class="{ invalid: passwordInvalid }"
              @blur="validatePassword"
              placeholder="Tu contraseña"
            />
            <button type="button" class="toggle-pass" @click="showPassword = !showPassword" :aria-pressed="showPassword" :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              {{ showPassword ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
          <small v-if="passwordInvalid" class="input-help">La contraseña debe tener al menos 6 caracteres</small>
        </div>

        <!-- Extras -->
        <div class="form-row spaced">
          <label class="checkbox">
            <input type="checkbox" v-model="remember" /> <span>Recordarme</span>
          </label>
          <a class="link-muted" @click.prevent="$router.push('/forgot')">¿Olvidaste tu contraseña?</a>
        </div>

        <!-- Submit -->
        <div class="form-row">
          <button class="btn-primary" :disabled="loading || formInvalid">
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            {{ loading ? 'Ingresando...' : 'Entrar' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="error" class="alert" role="alert">
          {{ error }}
        </div>

        <!-- Small note / version -->
        <p class="login-foot">¿No tienes cuenta? <a @click.prevent="$router.push('/register')">Regístrate</a></p>
      </form>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      logoSrc: null, // pon la ruta de tu logo si la tienes, ej: '/logo.png'
      form: { email: '', password: '' },
      loading: false,
      error: null,
      showPassword: false,
      remember: false
    }
  },
  computed: {
    emailInvalid() {
      if (!this.form.email) return false // no mostrar hasta que haya blur
      // simple regex para validar correo
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return !re.test(this.form.email)
    },
    passwordInvalid() {
      if (!this.form.password) return false
      return this.form.password.length < 6
    },
    formInvalid() {
      // evita enviar si campos son inválidos
      return !this.form.email || !this.form.password || this.emailInvalid || this.passwordInvalid
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    validateEmail() { /* getter emailInvalid se encarga */ },
    validatePassword() { /* getter passwordInvalid se encarga */ },

    async onSubmit() {
      this.error = null

      // validación final
      if (this.formInvalid) {
        this.error = 'Por favor completa correctamente el formulario.'
        return
      }

      this.loading = true
      try {
        const res = await this.login(this.form)
        if (!res.ok) {
          // res.error puede ser objeto o string según tu store
          this.error = typeof res.error === 'string' ? res.error : (res.error?.message || 'Credenciales inválidas')
          this.loading = false
          return
        }

        // Guardar preferencia "remember" si quieres (ej: en localStorage)
        if (this.remember) {
          localStorage.setItem('remember_email', this.form.email)
        } else {
          localStorage.removeItem('remember_email')
        }

        // Redirige a la ruta original o home
        const redirect = this.$route.query.redirect || '/'
        this.$router.push(redirect)
      } catch (e) {
        console.error(e)
        this.error = 'Ocurrió un error al iniciar sesión. Intenta nuevamente.'
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    // carga email recordado si existe
    const rememberEmail = localStorage.getItem('remember_email')
    if (rememberEmail) {
      this.form.email = rememberEmail
      this.remember = true
    }
    // opcional: asignar logoSrc si existe /assets/logo.png
    // this.logoSrc = require('@/assets/logo.png')
  }
}
</script>

<style scoped>
/* Tipografía recomendada (si quieres, añade en index.html: Google Fonts) */
.login-wrapper {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f6f9ff 0%, #ffffff 100%);
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(20,30,60,0.12);
  padding: 1.6rem;
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 0.6rem;
}
.logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin-bottom: 0.4rem;
  border-radius: 10px;
  background: #f2f6ff;
  padding: 6px;
}

.login-header h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.2px;
}
.muted {
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.login-form {
  margin-top: 0.8rem;
}
.form-group {
  margin-bottom: 0.9rem;
}
.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.35rem;
  color: #1f2937;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #e6e9ef;
  background: #fff;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color .12s ease, box-shadow .12s ease;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 6px 18px rgba(59,130,246,0.12);
}

.password-row {
  display: flex;
  gap: 0.5rem;
}
.password-row input {
  flex: 1;
}
.toggle-pass {
  background: transparent;
  border: 1px solid #e6e9ef;
  border-radius: 8px;
  padding: 0 0.7rem;
  min-width: 76px;
  cursor: pointer;
  color: #374151;
}
.toggle-pass:hover { border-color: #cbd5e1; }

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.6rem;
}
.spaced { justify-content: space-between; }

.checkbox {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  color: #374151;
  font-size: 0.92rem;
}
.link-muted {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: none;
}
.link-muted:hover { text-decoration: underline; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.56rem 0.9rem;
  border-radius: 10px;
  border: none;
  background: linear-gradient(90deg,#2b7dfa,#1c6be0);
  color: #fff;
  font-weight: 600;
  font-size: 0.98rem;
  cursor: pointer;
  width: 100%;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* small spinner */
.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  animation: spin .8s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.alert {
  margin-top: 0.9rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  color: #991b1b;
  font-weight: 600;
  font-size: 0.95rem;
}

.input-help {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: #6b7280;
}

.login-foot {
  margin-top: 0.9rem;
  font-size: 0.88rem;
  color: #6b7280;
  text-align: center;
}
.login-foot a { color: #2563eb; cursor: pointer; text-decoration: none; }
.login-foot a:hover { text-decoration: underline; }

/* invalid styles */
.invalid { border-color: #f43f5e !important; box-shadow: none !important; }
.has-error input { border-color: #f43f5e; }
</style>
