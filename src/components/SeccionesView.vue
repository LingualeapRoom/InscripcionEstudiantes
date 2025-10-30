<template>
  <v-container>
    <v-dialog v-model="dialog" max-width="500px">
      <template v-slot:activator="{ props }">
        <v-toolbar flat>
          <v-toolbar-title>Mantenimiento de Secciones</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            Nueva Sección
          </v-btn>
        </v-toolbar>
      </template>

      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <!-- Campo: Nombre de la Sección (A, B, C, etc.) -->
            <v-text-field
              v-model="editedItem.nombre_seccion"
              label="Nombre de la Sección (Ej: A, B, Matutina)"
              :rules="[v => !!v || 'El nombre de la sección es obligatorio']"
              required
            ></v-text-field>

            <!-- Selector para el Grado al que pertenece -->
            <v-select
              v-model="editedItem.grado_id"
              :items="gradosItems"
              item-title="nombre_grado_completo"
              item-value="id_grado"
              label="Grado Asignado"
              :rules="[v => !!v || 'La asignación de Grado es obligatoria']"
              required
            ></v-select>
            
            <v-alert v-if="errorMessage" type="error" class="mt-3" density="compact">
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

    <v-data-table
      :headers="headers"
      :items="secciones"
      :sort-by="[{ key: 'id_seccion', order: 'asc' }]"
      class="elevation-1"
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      <!-- Mostrar el nombre completo del grado usando el ID -->
      <template v-slot:item.nombre_grado="{ item }">{{ getNombreGrado(item.grado_id) }}</template>

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

const BASE_URL = "http://localhost/api_proyecto_final"; // Asegúrate de que esta ruta sea correcta

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    headers: [
      { title: "N°", value: "index", sortable: false, width: "5%" },
      { title: "ID Sección", value: "id_seccion", width: "10%" },
      { title: "Nombre de Sección", value: "nombre_seccion", width: "30%" },
      { title: "Grado Asignado", value: "nombre_grado", sortable: false, width: "45%" },
      { title: "Acciones", value: "actions", sortable: false, width: "10%" },
    ],
    secciones: [],
    grados: [], // Para almacenar los grados y poder mostrarlos en el selector y la tabla
    editedIndex: -1,
    editedItem: {
      id_seccion: 0,
      nombre_seccion: "",
      grado_id: null,
    },
    defaultItem: {
      id_seccion: 0,
      nombre_seccion: "",
      grado_id: null,
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nueva Sección" : "Editar Sección";
    },
    // Crea una lista de elementos para el v-select de Grados
    gradosItems() {
      return this.grados.map((g) => ({
        id_grado: g.id_grado,
        // Combina año y nombre para una mejor visualización
        nombre_grado_completo: `${g.grado} (${g.anio_lectivo})`, 
      }));
    },
  },

  watch: {
    dialog(val) {
      val || this.close();
      if (val && this.$refs.form) this.$refs.form.resetValidation();
    },
  },

  created() {
    this.fetchData();
  },

  methods: {
    async fetchData() {
      this.errorMessage = "";
      try {
        // 1. Cargar Grados (Necesario para el selector y la tabla)
        const gradosRes = await fetch(`${BASE_URL}/grados.php`);
        if (!gradosRes.ok) throw new Error("Error al cargar grados");
        this.grados = await gradosRes.json();
        
        // 2. Cargar Secciones
        const seccionesRes = await fetch(`${BASE_URL}/secciones.php`);
        if (!seccionesRes.ok) throw new Error("Error al cargar secciones");
        this.secciones = await seccionesRes.json();

      } catch (e) {
        console.error(e);
        this.errorMessage = "No se pudieron cargar los datos. Revisa la consola y tu API.";
      }
    },

    // Función auxiliar para obtener el nombre del Grado a partir de su ID
    getNombreGrado(id) {
      const grado = this.grados.find((g) => g.id_grado === id);
      return grado ? `${grado.grado} (${grado.anio_lectivo})` : "N/A";
    },

    editItem(item) {
      this.editedIndex = this.secciones.indexOf(item);
      // Es crucial asignar el valor de grado_id (que es la FK) al v-model
      this.editedItem = Object.assign({}, item); 
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar la sección "${item.nombre_seccion}"?`)) return;
      try {
        const res = await fetch(`${BASE_URL}/secciones.php?id=${item.id_seccion}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        // Optimización: si la eliminación es exitosa, eliminamos de la lista local
        this.secciones.splice(this.secciones.indexOf(item), 1);
      } catch (e) {
        console.error(e);
        this.errorMessage = "Error al eliminar la sección.";
      }
    },

    close() {
      this.dialog = false;
      this.$refs.form.resetValidation();
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.errorMessage = "";
    },

    async save() {
      this.errorMessage = "";
      if (!this.$refs.form.validate()) return;

      const itemToSave = { ...this.editedItem };
      // Asegurar que grado_id sea un entero (opcional si ya viene como number)
      itemToSave.grado_id = parseInt(itemToSave.grado_id); 

      try {
        const res = await fetch(
          this.editedIndex > -1
            ? `${BASE_URL}/secciones.php?id=${itemToSave.id_seccion}`
            : `${BASE_URL}/secciones.php`,
          {
            method: this.editedIndex > -1 ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToSave),
          }
        );
        
        if (!res.ok) {
            const errorBody = await res.json();
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        
        this.fetchData(); // Recargar datos para reflejar los cambios
        this.close();

      } catch (e) {
        console.error(e);
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
</style>
