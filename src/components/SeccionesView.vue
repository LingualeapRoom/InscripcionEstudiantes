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
            <v-text-field
              v-model="editedItem.nombre_seccion"
              label="Nombre de la Sección (Ej: A, B, Matutina)"
              :rules="[v => !!v || 'El nombre de la sección es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
            ></v-text-field>

            <v-select
              v-model="editedItem.grado_id"
              :items="gradosItems"
              item-title="nombre_grado_completo"
              item-value="id_grado"
              label="Grado Asignado"
              :rules="[v => (v !== null && v !== undefined) || 'La asignación de Grado es obligatoria']"
              required
              variant="outlined"
              density="comfortable"
            ></v-select>
            
            <v-select
              v-model="editedItem.profesor_id"
              :items="docentesItems"
              item-title="nombre_completo"
              item-value="id_profesor" 
              label="Docente Encargado (Opcional)"
              clearable
              persistent-clear
              variant="outlined"
              density="comfortable"
              class="mt-3"
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

    <v-data-table
      :headers="headers"
      :items="secciones"
      :sort-by="[{ key: 'id_seccion', order: 'asc' }]"
      class="elevation-1"
      no-data-text="No hay datos de secciones disponibles"
      loading-text="Cargando datos..."
    >
      <template v-slot:item.index="{ index }">{{ index + 1 }}</template>
      
      <template v-slot:item.nombre_grado="{ item }">{{ getNombreGrado(item.grado_id) }}</template>

      <template v-slot:item.nombre_docente="{ item }">{{ getNombreDocente(item.profesor_id) }}</template>

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

// Definir la URL base de la API
const BASE_URL = "http://localhost/api_proyecto_final"; 

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    headers: [
      { title: "N°", value: "index", sortable: false, width: "5%", align: 'start' },
      { title: "Nombre de Sección", value: "nombre_seccion", width: "30%", align: 'start' },
      { title: "Grado Asignado", value: "nombre_grado", sortable: false, width: "30%", align: 'start' },
      { title: "Docente Encargado", value: "nombre_docente", sortable: false, width: "25%", align: 'start' },
      { title: "Acciones", value: "actions", sortable: false, width: "10%", align: 'center' },
    ],
    secciones: [], 
    grados: [], 
    docentes: [], 
    editedIndex: -1,
    editedItem: {
      id_seccion: 0,
      nombre_seccion: "",
      grado_id: null,
      // *** CLAVE: Usar 'profesor_id' para sincronizar con PHP/DB ***
      profesor_id: null, 
    },
    defaultItem: {
      id_seccion: 0,
      nombre_seccion: "",
      grado_id: null,
      // *** CLAVE: Usar 'profesor_id' ***
      profesor_id: null, 
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nueva Sección" : "Editar Sección";
    },
    gradosItems() {
      return this.grados.map((g) => ({
        id_grado: parseInt(g.id_grado),
        nombre_grado_completo: `${g.grado} (${g.anio_lectivo})`, 
      }));
    },
    docentesItems() {
      return this.docentes.map((d) => ({
        id_profesor: parseInt(d.id_profesor), 
        nombre_completo: d.nombre_completo,
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
    /**
     * Carga Grados, Profesores y Secciones de manera eficiente y robusta.
     */
    async fetchData() {
      this.errorMessage = "";
      try {
        const [gradosRes, docentesRes, seccionesRes] = await Promise.all([
          fetch(`${BASE_URL}/grados.php`),
          fetch(`${BASE_URL}/profesores.php`), 
          fetch(`${BASE_URL}/secciones.php`)
        ]);

        if (!gradosRes.ok) throw new Error(`HTTP ${gradosRes.status} al cargar grados`);
        this.grados = await gradosRes.json();
        
        if (!docentesRes.ok) throw new Error(`HTTP ${docentesRes.status} al cargar profesores`);
        this.docentes = await docentesRes.json();

        if (!seccionesRes.ok) throw new Error(`HTTP ${seccionesRes.status} al cargar secciones`);
        
        const loadedSecciones = await seccionesRes.json();
        this.secciones = loadedSecciones.map(sec => ({
            ...sec,
            id_seccion: parseInt(sec.id_seccion, 10),
            grado_id: parseInt(sec.grado_id, 10), 
            // CLAVE: Mapear 'profesor_id' de la DB a nuestro modelo Vue
            profesor_id: sec.profesor_id ? parseInt(sec.profesor_id, 10) : null,
        }));

      } catch (e) {
        console.error("Error en fetchData:", e);
        this.errorMessage = `Error al cargar datos. Detalle: ${e.message}`;
      }
    },

    /**
     * Función auxiliar para obtener el nombre completo del Grado.
     */
    getNombreGrado(id) {
      if (!id) return "Sin Asignar";
      const grado = this.grados.find((g) => parseInt(g.id_grado) === id);
      return grado ? `${grado.grado} (${grado.anio_lectivo})` : "Grado No Encontrado";
    },

    /**
     * Función auxiliar para obtener el nombre completo del Docente (Profesor).
     * Usa la propiedad 'profesor_id'.
     */
    getNombreDocente(id) {
        if (!id) return "No Asignado";
        const docente = this.docentes.find((d) => {
            return parseInt(d.id_profesor) === id;
        });
        return docente ? docente.nombre_completo : "Docente Inválido";
    },

    /**
     * Prepara el diálogo para editar una sección existente.
     */
    editItem(item) {
      this.editedIndex = this.secciones.indexOf(item);
      this.editedItem = Object.assign({}, item); 
      this.dialog = true;
    },

    /**
     * Elimina una sección.
     */
    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar la sección "${item.nombre_seccion}"?`)) return; 
      try {
        const res = await fetch(`${BASE_URL}/secciones.php?id=${item.id_seccion}`, { method: "DELETE" });
        
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        
        this.secciones.splice(this.secciones.indexOf(item), 1);
        this.errorMessage = "";
      } catch (e) {
        console.error("Error al eliminar:", e);
        this.errorMessage = `Error al eliminar la sección: ${e.message}.`;
      }
    },

    /**
     * Cierra el diálogo y resetea el formulario.
     */
    close() {
      this.dialog = false;
      nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.editedIndex = -1;
        this.errorMessage = "";
        if (this.$refs.form) this.$refs.form.resetValidation();
      });
    },

    /**
     * Guarda (POST o PUT) el registro de la sección.
     */
    async save() {
      this.errorMessage = "";
      if (!this.$refs.form || !this.$refs.form.validate()) return;

      const isNew = this.editedIndex === -1;
      const itemToSave = { ...this.editedItem }; 
      
      itemToSave.grado_id = parseInt(itemToSave.grado_id, 10); 
      
      itemToSave.profesor_id = itemToSave.profesor_id 
          ? parseInt(itemToSave.profesor_id, 10) 
          : null; 
      
      try {
        const res = await fetch(
          isNew
            ? `${BASE_URL}/secciones.php`
            : `${BASE_URL}/secciones.php?id=${itemToSave.id_seccion}`,
          {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            // Enviamos el objeto con la clave 'profesor_id'
            body: JSON.stringify(itemToSave),
          }
        );
        
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido del servidor' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        
        await this.fetchData(); 
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