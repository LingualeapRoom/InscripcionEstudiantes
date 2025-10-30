<template>
  <v-container>
    <h1 class="text-h4 mb-4">Administración de Grados</h1>

    <!-- Notificación (Alerta) -->
    <v-alert
      v-if="alert.show"
      :type="alert.type"
      dismissible
      class="mb-4"
    >
      {{ alert.message }}
    </v-alert>

    <!-- Botón para Agregar Grado -->
    <div class="d-flex justify-end mb-4">
      <v-btn color="success" @click="openDialog('add')" large :loading="loading">
        <v-icon left>mdi-plus-circle-outline</v-icon>
        Agregar
      </v-btn>
    </div>

    <!-- Tarjeta que contiene la Tabla de Datos -->
    <v-card class="elevation-4">
      <v-card-title>
        Listado de Grados
        <v-spacer></v-spacer>
        <!-- Campo de búsqueda opcional -->
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
      </v-card-title>

      <!-- v-data-table: Muestra los registros de grados -->
      <v-data-table
        :headers="headers"
        :items="grados"
        :search="search"
        :items-per-page="10"
        :loading="loading"
        loading-text="Cargando datos... Por favor, espere."
        class="elevation-0"
      >
        <!-- Personalización de la columna "Acciones" -->
        <template v-slot:item.actions="{ item }">
          <!-- Botón de Editar -->
          <v-btn 
            icon 
            color="orange darken-1" 
            class="mr-2" 
            @click="openDialog('edit', item)"
            title="Editar Grado"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <!-- Botón de Eliminar -->
          <v-btn 
            icon 
            color="red" 
            @click="openDialog('delete', item)"
            title="Eliminar Grado"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        
        <!-- Mensaje de no datos -->
        <template v-slot:no-data>
          <v-alert :value="true" color="info" icon="mdi-alert-circle">
            No se encontraron registros de grados.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>

    <!-- Diálogo (Modal) para Agregar/Editar Grado -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card :loading="loading">
        <v-card-title class="headline blue darken-2 white--text">
          {{ formTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <!-- Año Lectivo (INT) -->
            <v-text-field
              v-model.number="editedItem.año_lectivo"
              label="Año Lectivo"
              :rules="[v => !!v || 'El año lectivo es requerido']"
              type="number"
            ></v-text-field>

            <!-- Grado (VARCHAR) -->
            <v-text-field
              v-model="editedItem.grado"
              label="Nombre del Grado"
              :rules="[v => !!v || 'El nombre del grado es requerido']"
            ></v-text-field>

            <!-- Profesor ID (Simulación de Dropdown/Select) -->
            <!-- Nota: En una app real, la lista de profesores se traería por API, 
                 aquí se simula para la interfaz. -->
            <v-select
              v-model="editedItem.profesor_id"
              :items="profesores"
              item-text="nombre_completo"
              item-value="id_profesor"
              label="Profesor Guía (ID)"
              :rules="[v => !!v || 'El profesor guía es requerido']"
            ></v-select>

            <!-- Especialidad ID (Simulación de Dropdown/Select) -->
            <v-select
              v-model="editedItem.id_especialidad"
              :items="especialidades"
              item-text="nombre_especialidad"
              item-value="id_especialidad"
              label="Especialidad (ID)"
              :rules="[v => !!v || 'La especialidad es requerida']"
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red darken-1" text @click="closeDialog" :disabled="loading">
            Cancelar
          </v-btn>
          <v-btn color="blue darken-1" text @click="save" :loading="loading">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Confirmación para Eliminar -->
    <v-dialog v-model="dialogDelete" max-width="350px">
      <v-card>
        <v-card-title class="text-h6">
          ¿Estás seguro de que quieres eliminar este Grado?
        </v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDeleteDialog" :disabled="loading">
            Cancelar
          </v-btn>
          <v-btn color="red darken-1" text @click="deleteItemConfirm" :loading="loading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
// La URL de tu API de Grados. ¡Asegúrate de que sea correcta!
// Usa la ruta que confirmaste que funciona: http://localhost/api_proyecto_final/grados.php
const API_URL = 'http://localhost/api_proyecto_final/grados.php'; 

// Objeto por defecto para un nuevo registro
const defaultItem = {
  id_grado: null,
  año_lectivo: new Date().getFullYear(),
  grado: '',
  profesor_id: null,
  id_especialidad: null,
};

export default {
  name: 'GradosView',
  data: () => ({
    search: '', 
    dialog: false, 
    dialogDelete: false, 
    valid: true, 
    loading: false, // Estado para mostrar indicadores de carga

    // Alerta de notificación
    alert: {
      show: false,
      message: '',
      type: 'success', // success, error, info, warning
    },

    headers: [
      { text: 'ID', value: 'id_grado' },
      { text: 'Año Lectivo', value: 'año_lectivo' },
      { text: 'Grado', value: 'grado' },
      { text: 'Profesor Guía', value: 'profesor_nombre' }, // Nombre del profesor (viene del JOIN)
      { text: 'Especialidad', value: 'especialidad_nombre' }, // Nombre de la especialidad (viene del JOIN)
      { text: 'Acciones', value: 'actions', sortable: false },
    ],
    
    grados: [], 
    
    // --- DATOS SIMULADOS PARA LOS SELECTORES (PROFESORES/ESPECIALIDADES) ---
    // En una aplicación completa, estos también se traerían por API.
    profesores: [
      { id_profesor: 101, nombre_completo: 'Lic. Ana Morales' },
      { id_profesor: 102, nombre_completo: 'Ing. Carlos Ruiz' },
      { id_profesor: 103, nombre_completo: 'MSc. Elena García' },
      { id_profesor: 104, nombre_completo: 'Dr. Javier Soto' },
      { id_profesor: 105, nombre_completo: 'Prof. Luisa Pérez' },
      { id_profesor: 106, nombre_completo: 'Arq. Roberto Méndez' },
    ], 
    especialidades: [
      { id_especialidad: 1, nombre_especialidad: 'Ciencias y Humanidades' },
      { id_especialidad: 2, nombre_especialidad: 'Contaduría' },
      { id_especialidad: 3, nombre_especialidad: 'Salud Comunitaria' },
      { id_especialidad: 4, nombre_especialidad: 'Desarrollo de Software' },
      { id_especialidad: 5, nombre_especialidad: 'Diseño Gráfico' },
      { id_especialidad: 6, nombre_especialidad: 'Servicios Turísticos' },
      { id_especialidad: 7, nombre_especialidad: 'Mecánica Automotriz' },
    ], 

    editedIndex: -1, 
    editedItem: { ...defaultItem },
    defaultItem: { ...defaultItem }, 
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? 'Agregar Nuevo Grado' : 'Editar Grado';
    },
  },

  watch: {
    dialog(val) {
      val || this.closeDialog();
    },
    dialogDelete(val) {
      val || this.closeDeleteDialog();
    },
  },

  created() {
    // Carga los datos de la base de datos real al iniciar
    this.fetchGrados();
  },

  methods: {
    // ------------------ MANEJO DE ALERTA ------------------
    showAlert(message, type = 'success') {
      this.alert.message = message;
      this.alert.type = type;
      this.alert.show = true;
      setTimeout(() => {
        this.alert.show = false;
      }, 3000);
    },

    // ------------------ MÉTODOS DE LA UI ------------------

    openDialog(action, item) {
      this.alert.show = false; // Oculta cualquier alerta anterior

      if (action === 'add') {
        this.editedIndex = -1;
        this.editedItem = { ...this.defaultItem }; 
        this.dialog = true;
      } else if (action === 'edit') {
        this.editedIndex = this.grados.findIndex(g => g.id_grado === item.id_grado);
        // Copiamos los datos del item para la edición
        this.editedItem = {
            id_grado: item.id_grado,
            año_lectivo: item.año_lectivo,
            grado: item.grado,
            profesor_id: item.profesor_id,
            id_especialidad: item.id_especialidad,
        };
        this.dialog = true;
      } else if (action === 'delete') {
        this.editedItem = Object.assign({}, item);
        this.dialogDelete = true;
      }
    },

    closeDialog() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = { ...this.defaultItem };
        this.editedIndex = -1;
        if (this.$refs.form) this.$refs.form.resetValidation();
      });
    },

    closeDeleteDialog() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedItem = { ...this.defaultItem };
      });
    },

    // ------------------ MÉTODOS FETCH (CRUD REAL) ------------------

    async fetchGrados() {
      this.loading = true;
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Error al cargar los grados: ' + response.statusText);
        }
        this.grados = await response.json();
      } catch (error) {
        console.error('Error en fetchGrados:', error);
        this.showAlert('No se pudieron cargar los datos. Revisa la conexión con tu API.', 'error');
      } finally {
        this.loading = false;
      }
    },

    async save() {
      // Validación del formulario
      if (!this.$refs.form || !this.$refs.form.validate()) return;
      
      this.loading = true;
      const isNew = this.editedIndex === -1;
      const method = isNew ? 'POST' : 'PUT';
      
      try {
        // La URL para POST es simple; para PUT podemos adjuntar el ID en la URL o el cuerpo.
        const response = await fetch(API_URL + (isNew ? '' : '?id=' + this.editedItem.id_grado), {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.editedItem)
        });

        // Parseamos la respuesta del backend
        const result = await response.json();

        if (response.ok && response.status !== 204) { 
            this.showAlert(result.message || (isNew ? 'Grado agregado.' : 'Grado actualizado.'));
            await this.fetchGrados(); // Recargar datos para ver el cambio
        } else {
            // Maneja errores de validación o del servidor (ej. 400 Bad Request)
            throw new Error(result.message || 'Error desconocido al guardar.');
        }

      } catch (error) {
        console.error('Error en save:', error);
        this.showAlert(`Operación fallida: ${error.message}`, 'error');
      } finally {
        this.loading = false;
        this.closeDialog();
      }
    },

    async deleteItemConfirm() {
      this.loading = true;
      const idToDelete = this.editedItem.id_grado;
      
      try {
        // Enviar la petición DELETE. El ID se pasa como parámetro de consulta.
        const response = await fetch(API_URL + '?id=' + idToDelete, {
          method: 'DELETE',
          // Aunque el ID está en la URL, el backend de PHP está configurado para leerlo
          // de $_GET o del cuerpo, por lo que enviamos el cuerpo para consistencia.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_grado: idToDelete }) 
        });

        // Intentamos parsear el JSON si existe, si no, asumimos éxito (204 No Content)
        const result = response.status !== 204 ? await response.json() : { message: "Registro eliminado." };

        if (response.ok) {
          this.showAlert(result.message || 'Grado eliminado exitosamente.');
          await this.fetchGrados(); // Recargar datos
        } else {
          // Si response.ok es falso (ej. 400, 500)
          throw new Error(result.message || 'Error desconocido al eliminar.');
        }

      } catch (error) {
        console.error('Error en deleteItemConfirm:', error);
        this.showAlert(`Eliminación fallida: ${error.message}`, 'error');
      } finally {
        this.loading = false;
        this.closeDeleteDialog();
      }
    },
  },
};
</script>

<style scoped>
/* Estilos opcionales */
.v-container {
  max-width: 1200px;
}
</style>
