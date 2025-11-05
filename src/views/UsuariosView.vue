<template>
  <div class="container py-4">
    <!-- Header / Título -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="display-6">Administración de Usuarios</h1>
      <button class="btn btn-success" @click="openAdd">
        <i class="bi bi-plus-lg"></i> Agregar
      </button>
    </div>

    <!-- Card con sombra que contiene la tabla -->
    <div class="card shadow-sm">
      <div class="card-body p-0">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:48px">#</th>
              <th>Nombre de usuario</th>
              <th>Tipo de usuario</th>
              <th>Correo</th>
              <th style="width:160px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, idx) in users" :key="u.id || u._id">
              <td><strong>{{ idx + 1 }}</strong></td>
              <td>{{ u.username || u.name || '-' }}</td>
              <td>{{ u.role || 'Usuario' }}</td>
              <td>{{ u.email || '-' }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-1" @click="openEdit(u)">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-sm btn-danger me-1" @click="confirmDelete(u)">
                  <i class="bi bi-trash-fill"></i>
                </button>
                <button class="btn btn-sm btn-info" @click="viewUser(u)">
                  <i class="bi bi-journal-bookmark-fill"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="5" class="text-center py-4">No hay usuarios para mostrar</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal ADD / EDIT (simple inline modal) -->
    <div v-if="showModal" class="modal-backdrop d-flex align-items-center justify-content-center">
      <div class="modal-dialog">
        <div class="modal-content">
          <form @submit.prevent="save">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing ? 'Editar usuario' : 'Agregar usuario' }}</h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Nombre de usuario</label>
                <input v-model="form.username" type="text" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Correo</label>
                <input v-model="form.email" type="email" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label">Tipo de usuario</label>
                <select v-model="form.role" class="form-select">
                  <option value="Administrador">Administrador</option>
                  <option value="Profesor">Profesor</option>
                  <option value="Estudiante">Estudiante</option>
                </select>
              </div>
              <div v-if="!editing" class="mb-3">
                <label class="form-label">Contraseña</label>
                <input v-model="form.password" type="password" class="form-control" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                {{ loading ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear usuario') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Confirm eliminar (simple) -->
    <div v-if="confirmDeleteModal" class="modal-backdrop d-flex align-items-center justify-content-center">
      <div class="card p-3">
        <p class="mb-3">¿Eliminar usuario <strong>{{ toDelete.username }}</strong>?</p>
        <div class="text-end">
          <button class="btn btn-secondary me-2" @click="cancelDelete">Cancelar</button>
          <button class="btn btn-danger" @click="deleteUserConfirmed" :disabled="loadingDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
  Notas:
  - Usa fetch en lugar de axios.
  - Ajusta BASE_URL si tu API tiene otra ruta.
  - Si usas token en localStorage: localStorage.getItem('token') -> se añade en headers Authorization.
*/

const BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:4000/api'

export default {
  name: 'UsuariosView',
  data() {
    return {
      users: [],
      loading: false,
      showModal: false,
      editing: false,
      form: { id: null, username: '', email: '', role: 'Administrador', password: '' },
      confirmDeleteModal: false,
      toDelete: null,
      loadingDelete: false
    }
  },
  created() {
    this.fetchUsers()
  },
  methods: {
    // Helper para crear headers con token si existe
    authHeaders(contentType = 'application/json') {
      const token = localStorage.getItem('token')
      const headers = {}
      if (contentType) headers['Content-Type'] = contentType
      if (token) headers['Authorization'] = `Bearer ${token}`
      return headers
    },

    async fetchUsers() {
      try {
        const res = await fetch(`${BASE_URL}/users`, {
          method: 'GET',
          headers: this.authHeaders()
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        // Ajuste: tu API puede devolver array directo o { users: [...] }
        this.users = Array.isArray(data) ? data : (data.users || data.data || [])
      } catch (err) {
        console.error('Error obteniendo usuarios', err)
        // opcional: mostrar un toast o alert
      }
    },

    openAdd() {
      this.editing = false
      this.form = { id: null, username: '', email: '', role: 'Administrador', password: '' }
      this.showModal = true
    },

    openEdit(user) {
      this.editing = true
      this.form = {
        id: user.id || user._id,
        username: user.username || user.name,
        email: user.email,
        role: user.role || 'Administrador',
        password: '' // no mostramos contraseña al editar
      }
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
    },

    async save() {
      this.loading = true
      try {
        if (this.editing) {
          // PUT /users/:id
          const id = this.form.id
          const payload = { username: this.form.username, email: this.form.email, role: this.form.role }
          const res = await fetch(`${BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: this.authHeaders(),
            body: JSON.stringify(payload)
          })
          if (!res.ok) {
            const errBody = await res.text()
            throw new Error(`Error ${res.status}: ${errBody}`)
          }
          // actualizar localmente
          await this.fetchUsers()
          this.closeModal()
        } else {
          // POST /users
          const payload = { username: this.form.username, email: this.form.email, role: this.form.role, password: this.form.password }
          const res = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify(payload)
          })
          if (!res.ok) {
            const errBody = await res.text()
            throw new Error(`Error ${res.status}: ${errBody}`)
          }
          await this.fetchUsers()
          this.closeModal()
        }
      } catch (err) {
        console.error('Error guardando usuario', err)
        alert('Ocurrió un error al guardar: ' + err.message)
      } finally {
        this.loading = false
      }
    },

    confirmDelete(user) {
      this.toDelete = user
      this.confirmDeleteModal = true
    },

    cancelDelete() {
      this.toDelete = null
      this.confirmDeleteModal = false
    },

    async deleteUserConfirmed() {
      if (!this.toDelete) return
      this.loadingDelete = true
      try {
        const id = this.toDelete.id || this.toDelete._id
        const res = await fetch(`${BASE_URL}/users/${id}`, {
          method: 'DELETE',
          headers: this.authHeaders()
        })
        if (!res.ok) {
          const errBody = await res.text()
          throw new Error(`Error ${res.status}: ${errBody}`)
        }
        await this.fetchUsers()
        this.cancelDelete()
      } catch (err) {
        console.error('Error eliminando usuario', err)
        alert('Ocurrió un error al eliminar: ' + err.message)
      } finally {
        this.loadingDelete = false
      }
    },

    viewUser(user) {
      // Aquí podrías abrir modal con detalles, o redirigir a una página de perfil
      alert(`Ver usuario: ${user.username || user.name || user.email}`)
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1050;
}
.modal-dialog {
  max-width: 540px;
  width: 100%;
}
.card {
  overflow: visible;
}
</style>
