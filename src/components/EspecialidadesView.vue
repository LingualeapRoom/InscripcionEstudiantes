<template>
  <v-container>
    <!-- Diálogo para Crear/Editar Especialidad -->
    <v-dialog v-model="dialog" max-width="500px">
      <template v-slot:activator="{ props }">
        <v-toolbar flat>
          <v-toolbar-title>Mantenimiento de Especialidades</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            Nueva Especialidad
          </v-btn>
        </v-toolbar>
      </template>

      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="editedItem.nombre_especialidad"
              label="Nombre de la Especialidad"
              :rules="[v => !!v || 'El nombre es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-alert v-if="errorMessage" type="error" class="mt-3" density="compact" closable>
              {{ errorMessage }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="save" :disabled="!valid">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Tabla de Especialidades -->
    <v-data-table
      :headers="headers"
      :items="especialidades"
      :sort-by="[{ key: 'id_especialidad', order: 'asc' }]"
      class="elevation-1"
      no-data-text="No hay datos de especialidades disponibles"
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      <template v-slot:item.actions="{ item }">
        <v-icon size="small" class="me-2" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template v-slot:no-data>
        <v-btn color="primary" @click="fetchData">Recargar Datos</v-btn>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { nextTick } from "vue";

// Asegúrate de que esta URL base apunte a tu directorio de la API
const BASE_URL = "http://localhost/api_proyecto_final"; 

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    headers: [
      { title: "N°", value: "index", sortable: false, width: "10%", align: 'start' },
      // Se eliminó la columna "ID" (id_especialidad)
      { title: "Nombre de la Especialidad", value: "nombre_especialidad", width: "75%", align: 'start' },
      { title: "Acciones", value: "actions", sortable: false, width: "15%", align: 'center' },
    ],
    especialidades: [], // Array para almacenar los datos de especialidades
    editedIndex: -1,
    editedItem: {
      id_especialidad: 0,
      nombre_especialidad: "",
    },
    defaultItem: {
      id_especialidad: 0,
      nombre_especialidad: "",
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nueva Especialidad" : "Editar Especialidad";
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
      if (val && this.$refs.form) nextTick(() => this.$refs.form.resetValidation());
    },
  },

  created() {
    this.fetchData();
  },

  methods: {
    async fetchData() {
      this.errorMessage = "";
      try {
        const res = await fetch(`${BASE_URL}/especialidad.php`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar especialidades`);
        
        const loadedEspecialidades = await res.json();
        
        // Mapear y convertir id_especialidad a número entero
        // Aunque no se muestra, el ID es esencial para las operaciones de EDITAR/ELIMINAR
        this.especialidades = loadedEspecialidades.map(e => ({
            ...e,
            id_especialidad: parseInt(e.id_especialidad),
        }));

      } catch (e) {
        console.error("Error en fetchData (Especialidades):", e);
        if (e.name === 'SyntaxError') {
             this.errorMessage = "Error de sintaxis: El servidor PHP envió texto inesperado (ej. Warning o Notice) antes del JSON. Revisa tus archivos PHP.";
        } else {
            this.errorMessage = `No se pudieron cargar los datos de especialidades. Detalle: ${e.message}`;
        }
      }
    },

    editItem(item) {
      this.editedIndex = this.especialidades.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      // Uso de un sustituto simple para window.confirm()
      if (!confirm(`¿Estás seguro de eliminar la especialidad "${item.nombre_especialidad}"?`)) return; 

      try {
        const res = await fetch(`${BASE_URL}/especialidad.php?id=${item.id_especialidad}`, { method: "DELETE" });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        this.especialidades.splice(this.especialidades.indexOf(item), 1);
        this.errorMessage = "";
      } catch (e) {
        console.error("Error al eliminar:", e);
        this.errorMessage = `Error al eliminar la especialidad: ${e.message}`;
      }
    },

    close() {
      this.dialog = false;
      this.errorMessage = "";
      nextTick(() => {
        if (this.$refs.form) this.$refs.form.resetValidation();
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
      });
    },

    async save() {
      this.errorMessage = "";
      // Validar el formulario
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      const itemToSave = { ...this.editedItem };
      
      try {
        const isUpdate = this.editedIndex > -1;
        const url = isUpdate 
            ? `${BASE_URL}/especialidad.php?id=${itemToSave.id_especialidad}` 
            : `${BASE_URL}/especialidad.php`;
        
        const method = isUpdate ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToSave),
        });
        
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido del servidor (No JSON)' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        
        this.fetchData(); // Recargar datos
        this.close();
      } catch (e) {
        console.error("Error al guardar:", e);
        this.errorMessage = `Error al guardar: ${e.message}`;
      }
    },
  },
};
</script>

<style scoped>
.v-data-table {
  max-width: 100%;
}
.v-container {
  padding: 16px;
}
</style>