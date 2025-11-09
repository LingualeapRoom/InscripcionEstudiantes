<template>
  <v-container>
    <!-- Diálogo para Crear/Editar Grado -->
    <v-dialog v-model="dialog" max-width="500px">
      <template v-slot:activator="{ props }">
        <v-toolbar flat>
          <v-toolbar-title>Mantenimiento de Grados</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            Nuevo Grado
          </v-btn>
        </v-toolbar>
      </template>

      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-select
              v-model="editedItem.anio_lectivo"
              :items="[2023, 2024, 2025]"
              label="Año Lectivo"
              :rules="[v => !!v || 'Año Lectivo es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
            ></v-select>

            <v-text-field
              v-model="editedItem.grado"
              label="Nombre del Grado"
              :rules="[v => !!v || 'Grado es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <!-- CAMBIO: Campo Profesor Encargado (profesor_id) ELIMINADO del formulario -->
            <!-- <v-select
              v-model="editedItem.profesor_id"
              :items="profesoresItems"
              item-title="nombre_completo"
              item-value="id_profesor"
              label="Profesor Encargado"
              :rules="[v => !!v || 'Profesor Encargado es obligatorio']"
              required
            ></v-select> -->

            <v-select
              v-model="editedItem.id_especialidad"
              :items="especialidadesItems"
              item-title="nombre_especialidad"
              item-value="id_especialidad"
              label="Especialidad (Opcional)"
              clearable
              variant="outlined"
              density="comfortable"
            ></v-select>

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

    <!-- Tabla de Grados (Las columnas ya están ajustadas) -->
    <v-data-table
      :headers="headers"
      :items="grados"
      :sort-by="[{ key: 'id_grado', order: 'asc' }]"
      class="elevation-1"
      no-data-text="No hay datos de grados disponibles"
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      <template v-slot:item.nombre_especialidad="{ item }">{{ getNombreEspecialidad(item.id_especialidad) }}</template>
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

const BASE_URL = "http://localhost/api_proyecto_final"; // <- ruta completa de XAMPP

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    headers: [
      { title: "N°", value: "index", sortable: false, width: "5%", align: 'start' },
      { title: "Nombre del Grado", value: "grado", width: "35%", align: 'start' },
      { title: "Especialidad", value: "nombre_especialidad", sortable: false, width: "30%", align: 'start' },
      { title: "Año Lectivo", value: "anio_lectivo", width: "15%", align: 'start' },
      { title: "Acciones", value: "actions", sortable: false, width: "15%", align: 'center' },
    ],
    grados: [],
    // CAMBIO: Se eliminan profesores de la data, ya no se usan en esta vista
    // profesores: [], 
    especialidades: [],
    editedIndex: -1,
    editedItem: {
      id_grado: 0,
      anio_lectivo: new Date().getFullYear(),
      grado: "",
      // CAMBIO: profesor_id se inicializa, pero no se expone en el formulario
      profesor_id: null, 
      id_especialidad: null,
    },
    defaultItem: {
      id_grado: 0,
      anio_lectivo: new Date().getFullYear(),
      grado: "",
      profesor_id: null, // Mantenemos la propiedad para POST/PUT si la API lo requiere
      id_especialidad: null,
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nuevo Grado" : "Editar Grado";
    },
    // CAMBIO: profesorItems eliminado, ya no se usa.
    // profesoresItems() {
    //   return this.profesores.map((p) => ({
    //     id_profesor: parseInt(p.id_profesor),
    //     nombre_completo: p.nombre_completo,
    //   }));
    // },
    especialidadesItems() {
      return this.especialidades.map((e) => ({
        id_especialidad: parseInt(e.id_especialidad),
        nombre_especialidad: e.nombre_especialidad,
      }));
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
        // CAMBIO: La llamada a profesores.php se elimina, solo necesitamos grados y especialidades
        const [gradosRes, especialidadesRes] = await Promise.all([
          fetch(`${BASE_URL}/grados.php`),
          fetch(`${BASE_URL}/especialidad.php`),
        ]);
        
        // Cargar Grados
        if (!gradosRes.ok) throw new Error(`HTTP ${gradosRes.status} al cargar grados`);
        const loadedGrados = await gradosRes.json();
        this.grados = loadedGrados.map(g => ({
            ...g,
            id_grado: parseInt(g.id_grado),
            anio_lectivo: parseInt(g.anio_lectivo),
            profesor_id: g.profesor_id ? parseInt(g.profesor_id) : null,
            id_especialidad: g.id_especialidad ? parseInt(g.id_especialidad) : null,
        }));
        
        // Cargar Especialidades
        if (!especialidadesRes.ok) throw new Error(`HTTP ${especialidadesRes.status} al cargar especialidades`);
        this.especialidades = await especialidadesRes.json();

      } catch (e) {
        console.error("Error en fetchData:", e);
        this.errorMessage = `No se pudieron cargar los datos. Revisa la consola. Detalle: ${e.message}`;
      }
    },

    // CAMBIO: getNombreProfesor eliminado, ya no se usa.
    // getNombreProfesor(id) {
    //   if (!id) return "N/A";
    //   const profesor = this.profesores.find((p) => parseInt(p.id_profesor) === id);
    //   return profesor ? profesor.nombre_completo : "N/A";
    // },

    getNombreEspecialidad(id) {
      if (id === null || id === undefined) return "N/A";
      const esp = this.especialidades.find((e) => parseInt(e.id_especialidad) === id);
      return esp ? esp.nombre_especialidad : "N/A";
    },

    editItem(item) {
      this.editedIndex = this.grados.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar el grado "${item.grado}"?`)) return; 
      try {
        const res = await fetch(`${BASE_URL}/grados.php?id=${item.id_grado}`, { method: "DELETE" });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        this.grados.splice(this.grados.indexOf(item), 1);
        this.errorMessage = "";
      } catch (e) {
        console.error("Error al eliminar:", e);
        this.errorMessage = `Error al eliminar el grado: ${e.message}`;
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
      if (!this.$refs.form || !this.$refs.form.validate()) return;

      const itemToSave = { ...this.editedItem };
      
      // Sanitizar datos para la API
      itemToSave.id_especialidad = itemToSave.id_especialidad === "" || itemToSave.id_especialidad === undefined
        ? null 
        : parseInt(itemToSave.id_especialidad);
        
      itemToSave.anio_lectivo = parseInt(itemToSave.anio_lectivo);
      
      // CLAVE: Aseguramos que profesor_id siempre sea null si no se proporciona en el formulario
      // (ya que se ha eliminado, asumimos que siempre es null al crear/editar desde esta interfaz)
      // Si la API requiere un profesor_id, esto podría causar un error en la API, pero a nivel de Vue es correcto.
      itemToSave.profesor_id = null; 

      try {
        const isUpdate = this.editedIndex > -1;
        const res = await fetch(
          isUpdate
            ? `${BASE_URL}/grados.php?id=${itemToSave.id_grado}`
            : `${BASE_URL}/grados.php`,
          {
            method: isUpdate ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToSave),
          }
        );
        
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido del servidor' }));
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