<template>
  <v-container>
    <v-dialog v-model="dialog" max-width="600px">
      <template v-slot:activator="{ props }">
        <v-toolbar flat>
          <v-toolbar-title>Mantenimiento de Estudiantes</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            Nuevo Estudiante
          </v-btn>
        </v-toolbar>
      </template>

      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.nombre"
                  label="Nombre"
                  :rules="[v => !!v || 'El nombre es obligatorio']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.apellido"
                  label="Apellido"
                  :rules="[v => !!v || 'El apellido es obligatorio']"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.fecha_nacimiento"
                  label="Fecha de Nacimiento"
                  type="date"
                  :rules="[v => !!v || 'La fecha es obligatoria']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.seccion_id"
                  :items="seccionesItems"
                  item-title="nombre_seccion_completo"
                  item-value="id_seccion"
                  label="Sección Asignada"
                  :rules="[v => !!v || 'La sección es obligatoria']"
                  required
                ></v-select>
              </v-col>
            </v-row>

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
      :items="estudiantes"
      :sort-by="[{ key: 'id_estudiante', order: 'asc' }]"
      class="elevation-1"
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      <template v-slot:item.nombre_completo="{ item }">{{ item.nombre }} {{ item.apellido }}</template>
      <template v-slot:item.seccion_asignada="{ item }">{{ getNombreSeccion(item.seccion_id) }}</template>

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

// *************************************************************************
// NOTA: Asegúrate de que tienes un archivo 'estudiantes.php' y 'secciones.php'
// funcionales en tu API.
// *************************************************************************
const BASE_URL = "http://localhost/api_proyecto_final"; 

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    headers: [
      { title: "N°", value: "index", sortable: false, width: "5%" },
      { title: "Nombre Completo", value: "nombre_completo", width: "30%" },
      { title: "Fecha Nacimiento", value: "fecha_nacimiento", width: "20%" },
      { title: "Sección Asignada", value: "seccion_asignada", sortable: false, width: "35%" },
      { title: "Acciones", value: "actions", sortable: false, width: "10%" },
    ],
    estudiantes: [],
    secciones: [], // Para almacenar las secciones y poder asignarlas
    grados: [], // Se necesita para construir el nombre de la sección completa
    editedIndex: -1,
    editedItem: {
      id_estudiante: 0,
      nombre: "",
      apellido: "",
      fecha_nacimiento: new Date().toISOString().substring(0, 10), // Fecha actual por defecto
      seccion_id: null,
    },
    defaultItem: {
      id_estudiante: 0,
      nombre: "",
      apellido: "",
      fecha_nacimiento: new Date().toISOString().substring(0, 10),
      seccion_id: null,
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nuevo Estudiante" : "Editar Estudiante";
    },
    // Combina grado y sección para una visualización clara en el selector
    seccionesItems() {
      return this.secciones.map((s) => {
        const grado = this.grados.find((g) => g.id_grado === s.grado_id);
        const nombreGrado = grado ? `${grado.grado} (${grado.anio_lectivo})` : 'Grado Desconocido';
        return {
          id_seccion: s.id_seccion,
          nombre_seccion_completo: `${nombreGrado} - Sección ${s.nombre_seccion}`, 
        };
      });
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
        // 1. Cargar Grados (Necesario para los nombres de secciones)
        const gradosRes = await fetch(`${BASE_URL}/grados.php`);
        this.grados = await gradosRes.json();

        // 2. Cargar Secciones (Necesario para el selector y la tabla)
        const seccionesRes = await fetch(`${BASE_URL}/secciones.php`);
        this.secciones = await seccionesRes.json();
        
        // 3. Cargar Estudiantes
        const estudiantesRes = await fetch(`${BASE_URL}/estudiantes.php`);
        this.estudiantes = await estudiantesRes.json();

      } catch (e) {
        console.error("Error al cargar datos:", e);
        this.errorMessage = "No se pudieron cargar los datos (Estudiantes, Secciones o Grados). Revisa tu API.";
      }
    },

    // Función auxiliar para obtener el nombre de la sección y grado
    getNombreSeccion(id) {
        if (!id) return "N/A";
        const seccion = this.secciones.find((s) => s.id_seccion === id);
        if (!seccion) return "Sección Desconocida";

        const grado = this.grados.find((g) => g.id_grado === seccion.grado_id);
        const nombreGrado = grado ? `${grado.grado} (${grado.anio_lectivo})` : 'Grado Desconocido';
        
        return `${nombreGrado} - Sección ${seccion.nombre_seccion}`;
    },

    editItem(item) {
      this.editedIndex = this.estudiantes.indexOf(item);
      // Asignar el item. seccion_id debe ser un número entero o null
      this.editedItem = Object.assign({}, item); 
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar a ${item.nombre} ${item.apellido}?`)) return;
      try {
        const res = await fetch(`${BASE_URL}/estudiantes.php?id=${item.id_estudiante}`, { method: "DELETE" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        this.estudiantes.splice(this.estudiantes.indexOf(item), 1);
      } catch (e) {
        console.error(e);
        this.errorMessage = "Error al eliminar el estudiante.";
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
      // Asegurar que seccion_id sea un entero (es la clave foránea)
      itemToSave.seccion_id = parseInt(itemToSave.seccion_id); 

      try {
        const res = await fetch(
          this.editedIndex > -1
            ? `${BASE_URL}/estudiantes.php?id=${itemToSave.id_estudiante}`
            : `${BASE_URL}/estudiantes.php`,
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