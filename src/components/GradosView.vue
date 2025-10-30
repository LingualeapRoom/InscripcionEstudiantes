<template>
  <v-container>
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
            ></v-select>

            <v-text-field
              v-model="editedItem.grado"
              label="Nombre del Grado"
              :rules="[v => !!v || 'Grado es obligatorio']"
              required
            ></v-text-field>

            <v-select
              v-model="editedItem.profesor_id"
              :items="profesoresItems"
              item-title="nombre_completo"
              item-value="id_profesor"
              label="Profesor Encargado"
              :rules="[v => !!v || 'Profesor Encargado es obligatorio']"
              required
            ></v-select>

            <v-select
              v-model="editedItem.id_especialidad"
              :items="especialidadesItems"
              item-title="nombre_especialidad"
              item-value="id_especialidad"
              label="Especialidad (Opcional)"
              clearable
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
      :items="grados"
      :sort-by="[{ key: 'id_grado', order: 'asc' }]"
      class="elevation-1"
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      <template v-slot:item.nombre_profesor="{ item }">{{ getNombreProfesor(item.profesor_id) }}</template>
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
      { title: "N°", value: "index", sortable: false, width: "5%" },
      { title: "Año Lectivo", value: "anio_lectivo", width: "10%" },
      { title: "Nombre del Grado", value: "grado", width: "25%" },
      { title: "Profesor Encargado", value: "nombre_profesor", sortable: false, width: "25%" },
      { title: "Especialidad", value: "nombre_especialidad", sortable: false, width: "25%" },
      { title: "Acciones", value: "actions", sortable: false, width: "10%" },
    ],
    grados: [],
    profesores: [],
    especialidades: [],
    editedIndex: -1,
    editedItem: {
      id_grado: 0,
      anio_lectivo: new Date().getFullYear(),
      grado: "",
      profesor_id: null,
      id_especialidad: null,
    },
    defaultItem: {
      id_grado: 0,
      anio_lectivo: new Date().getFullYear(),
      grado: "",
      profesor_id: null,
      id_especialidad: null,
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nuevo Grado" : "Editar Grado";
    },
    profesoresItems() {
      return this.profesores.map((p) => ({
        id_profesor: p.id_profesor,
        nombre_completo: p.nombre_completo,
      }));
    },
    especialidadesItems() {
      return this.especialidades.map((e) => ({
        id_especialidad: e.id_especialidad,
        nombre_especialidad: e.nombre_especialidad,
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
        const gradosRes = await fetch(`${BASE_URL}/grados.php`);
        this.grados = await gradosRes.json();

        const profesoresRes = await fetch(`${BASE_URL}/profesores.php`);
        this.profesores = await profesoresRes.json();

        const especialidadesRes = await fetch(`${BASE_URL}/especialidad.php`);
        this.especialidades = await especialidadesRes.json();
      } catch (e) {
        console.error(e);
        this.errorMessage = "No se pudieron cargar los datos. Revisa la consola.";
      }
    },

    getNombreProfesor(id) {
      const profesor = this.profesores.find((p) => p.id_profesor === id);
      return profesor ? profesor.nombre_completo : "N/A";
    },

    getNombreEspecialidad(id) {
      if (id === null || id === undefined) return "N/A";
      const esp = this.especialidades.find((e) => e.id_especialidad === id);
      return esp ? esp.nombre_especialidad : "N/A";
    },

    editItem(item) {
      this.editedIndex = this.grados.indexOf(item);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm("¿Estás seguro de eliminar este grado?")) return;
      try {
        const res = await fetch(`${BASE_URL}/grados.php?id=${item.id_grado}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.grados.splice(this.grados.indexOf(item), 1);
      } catch (e) {
        console.error(e);
        this.errorMessage = "Error al eliminar el grado.";
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
      if (itemToSave.id_especialidad === "") itemToSave.id_especialidad = null;
      itemToSave.anio_lectivo = parseInt(itemToSave.anio_lectivo);

      try {
        const res = await fetch(
          this.editedIndex > -1
            ? `${BASE_URL}/grados.php?id=${itemToSave.id_grado}`
            : `${BASE_URL}/grados.php`,
          {
            method: this.editedIndex > -1 ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToSave),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.fetchData();
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
