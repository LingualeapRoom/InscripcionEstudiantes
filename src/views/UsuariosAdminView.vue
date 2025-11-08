<template>
  <v-container>
    <h1 class="text-h3 my-8">Administración de Usuarios</h1>

    <v-card class="pa-4">
      <div class="d-flex justify-end mb-4">
        <v-btn color="success" @click="openCreate">
          <v-icon left>mdi-plus-circle-outline</v-icon>Agregar
        </v-btn>
      </div>

      <v-alert v-if="error" type="error" dense class="mb-4">{{ error }}</v-alert>

      <v-data-table
        :headers="headers"
        :items="usuarios"
        :loading="loading"
        item-key="id"
        class="elevation-2"
        fixed-header
        height="480"
      >
        <template #item.index="{ index }">{{ index + 1 }}</template>
        <template #item.rol="{ item }">{{ item.rol }}</template>
        <template #item.acciones="{ item }">
          <v-btn icon variant="flat" class="mr-1" @click="openEdit(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="flat" color="error" class="mr-1" @click="confirmDelete(item)">
            <v-icon>mdi-trash-can</v-icon>
          </v-btn>
          <v-btn icon variant="flat">
            <v-icon>mdi-book-open-variant</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title>{{ form.id ? 'Editar usuario' : 'Nuevo usuario' }}</v-card-title>
        <v-card-text>
          <v-form ref="f" v-model="valid">
            <v-text-field v-model="form.nombre" label="Nombre de usuario" :rules="[r]" required />
            <v-text-field v-model="form.email" label="Correo" type="email" :rules="[r]" required />
            <v-select v-model="form.rol" :items="roles" label="Tipo de usuario" :rules="[r]" required />
            <v-text-field
              v-model="form.password"
              :type="showPass ? 'text' : 'password'"
              :append-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPass = !showPass"
              :label="form.id ? 'Contraseña (opcional)' : 'Contraseña'"
              :rules="form.id ? [] : [r]"
              hint="Déjala vacía para no cambiar"
              persistent-hint
            />
          </v-form>
          <v-alert v-if="error" type="error" dense class="mt-2">{{ error }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirm" max-width="420">
      <v-card>
        <v-card-title>Eliminar usuario</v-card-title>
        <v-card-text>¿Seguro que deseas eliminar a <b>{{ toDelete?.nombre }}</b>?</v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="confirm=false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="doDelete">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
const API =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) ||
  process.env.VUE_APP_API_BASE || 'http://localhost/api';

export default {
  name: 'UsuariosAdminView',
  data: () => ({
    headers: [
      { title: '#', key: 'index', width: 60 },
      { title: 'Nombre de usuario', key: 'nombre' },
      { title: 'Tipo de usuario', key: 'rol' },
      { title: 'Correo', key: 'email' },
      { title: 'Acciones', key: 'acciones', sortable: false, width: 150 },
    ],
    roles: ['Administrador','Docente','Secretaría','Invitado'],
    usuarios: [],
    loading: false,
    dialog: false,
    confirm: false,
    valid: false,
    form: { id:null, nombre:'', email:'', rol:'Administrador', password:'' },
    showPass: false,
    saving: false,
    deleting: false,
    toDelete: null,
    error: null,
  }),
  computed: {
    token(){ return this.$store.state.token; }
  },
  mounted(){ this.fetchUsuarios(); },
  methods: {
    r: v => !!v || 'Requerido',

    async api(path, options={}){
      const headers = { ...(options.headers || {}) };
      if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
      if (this.token) headers.Authorization = `Bearer ${this.token}`;

      const res = await fetch(`${API}${path}`, { ...options, headers });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok || data.ok === false) {
        const msg = data.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    },

    async fetchUsuarios(){
      this.loading = true;
      this.error = null;
      try {
        const { users } = await this.api('/users/list.php');
        this.usuarios = Array.isArray(users) ? users : [];
      } catch (e) {
        this.error = e.message || 'Error al cargar usuarios';
        this.usuarios = [];
      } finally {
        this.loading = false;
      }
    },

    openCreate(){
      this.error=null;
      this.form = { id:null, nombre:'', email:'', rol:'Administrador', password:'' };
      this.dialog=true;
    },

    openEdit(u){
      this.error=null;
      this.form = { id:u.id, nombre:u.nombre, email:u.email, rol:u.rol, password:'' };
      this.dialog=true;
    },

    async save(){
      const ok = await this.$refs.f.validate();
      if (!ok) return;
      this.saving = true;
      this.error=null;
      try{
        const body = JSON.stringify(this.form);
        if (this.form.id) await this.api('/users/update.php', { method:'POST', body });
        else              await this.api('/users/create.php', { method:'POST', body });
        this.dialog=false;
        await this.fetchUsuarios();
      } catch(e){
        this.error = e.message || 'No se pudo guardar';
      } finally {
        this.saving=false;
      }
    },

    confirmDelete(u){ this.toDelete=u; this.confirm=true; },

    async doDelete(){
      this.deleting=true;
      try{
        await this.api('/users/delete.php', { method:'POST', body: JSON.stringify({ id:this.toDelete.id }) });
        this.confirm=false;
        await this.fetchUsuarios();
      } catch(e){
        this.error = e.message || 'No se pudo eliminar';
      } finally {
        this.deleting=false;
      }
    }
  }
};
</script>
