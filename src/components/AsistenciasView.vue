<template>
  <v-container>
    <v-dialog v-model="dialog" max-width="600px">
      <template v-slot:activator="{ props }">
        <v-toolbar flat class="mb-4">
          <v-toolbar-title>Gestión de Asistencias</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          
          <v-select
            v-model="filtroGradoId"
            :items="grados"
            item-title="grado"
            item-value="id_grado"
            label="Filtrar por Grado"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            class="mr-4"
            style="max-width: 180px;"
          ></v-select>

          <v-select
            v-model="filtroNIE"
            :items="estudiantes"
            item-title="nombre_completo"
            item-value="NIE"
            label="Filtrar por Estudiante"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            class="mr-4"
            style="max-width: 250px;"
          ></v-select>

          <v-text-field
            v-model="filtroFecha"
            label="Filtrar por Fecha"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            type="date"
            class="mr-4"
            style="max-width: 180px;"
          ></v-text-field>
          
          <v-spacer></v-spacer>
          
          <v-btn color="primary" dark class="mb-2" v-bind="props">
            Nueva Asistencia
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
              v-model="editedItem.NIE"
              :items="estudiantes"
              item-title="nombre_completo"
              item-value="NIE"
              label="Estudiante (NIE)"
              :rules="[v => !!v || 'El estudiante es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-select>

            <v-select
              v-model="editedItem.grado_id"
              :items="grados"
              item-title="grado"
              item-value="id_grado"
              label="Grado"
              :rules="[v => !!v || 'El grado es obligatorio']"
              required
              variant="outlined"
              density="comfortable"
              class="mb-3"
            ></v-select>

            <v-text-field
              v-model="editedItem.fecha"
              label="Fecha"
              :rules="[v => !!v || 'La fecha es obligatoria', v => /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Formato de fecha inválido (YYYY-MM-DD)']"
              required
              variant="outlined"
              density="comfortable"
              type="date"
              class="mb-3"
            ></v-text-field>

            <v-select
              v-model="editedItem.estado"
              :items="estadosAsistencia"
              label="Estado"
              :rules="[v => !!v || 'El estado es obligatorio']"
              required
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

    <v-data-table
      :headers="headers"
      :items="asistenciasFiltradas"
      :sort-by="[{ key: 'fecha', order: 'desc' }]"
      class="elevation-1"
      no-data-text="No hay datos de asistencias disponibles"
    >
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
    
    // VARIABLES DE FILTRO
    filtroNIE: null, 
    filtroFecha: null,
    filtroGradoId: null, // NUEVA VARIABLE DE FILTRO
    // FIN VARIABLES DE FILTRO
    
    headers: [
      { title: "Estudiante", value: "nombre_estudiante", align: 'start' }, 
      { title: "Grado", value: "nombre_grado", align: 'start' }, 
      { title: "Fecha", value: "fecha", align: 'start' },
      { title: "Estado", value: "estado", align: 'start' },
      { title: "Acciones", value: "actions", sortable: false, width: "15%", align: 'center' },
    ],
    asistencias: [], 
    estudiantes: [], 
    grados: [], 
    estadosAsistencia: ['Presente', 'Ausente', 'Tardanza'], 
    editedIndex: -1,
    editedItem: {
      id_asistencia: 0,
      NIE: "",
      grado_id: null, 
      fecha: "",
      estado: "",
      nombre_estudiante: "", 
      nombre_grado: "",
    },
    defaultItem: {
      id_asistencia: 0,
      NIE: "",
      grado_id: null,
      fecha: new Date().toISOString().substring(0, 10), 
      estado: "Presente",
      nombre_estudiante: "",
      nombre_grado: "",
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "Nueva Asistencia" : "Editar Asistencia";
    },
    
    // LÓGICA DE FILTRADO ACTUALIZADA CON GRADO
    asistenciasFiltradas() {
      let datosFiltrados = this.asistencias;

      // 1. Filtrar por GRADO
      if (this.filtroGradoId !== null) {
        // Aseguramos que la comparación sea con números, ya que 'id_grado' se carga como entero
        datosFiltrados = datosFiltrados.filter(a => a.grado_id === this.filtroGradoId);
      }

      // 2. Filtrar por NIE (Estudiante)
      if (this.filtroNIE) {
        datosFiltrados = datosFiltrados.filter(a => a.NIE === this.filtroNIE);
      }

      // 3. Filtrar por Fecha
      if (this.filtroFecha) {
        datosFiltrados = datosFiltrados.filter(a => a.fecha === this.filtroFecha);
      }
      
      return datosFiltrados;
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
    this.fetchDependencies(); 
  },

  methods: {
    async fetchDependencies() {
      this.errorMessage = "";
      
      // Cargar lista de estudiantes
      try {
        const resEstudiantes = await fetch(`${BASE_URL}/estudiantes.php`);
        if (!resEstudiantes.ok) throw new Error(`HTTP ${resEstudiantes.status} al cargar estudiantes`);
        const data = await resEstudiantes.json();
        this.estudiantes = data; 
      } catch (e) {
        console.error("Error cargando estudiantes:", e);
        this.errorMessage = `Error al cargar la lista de estudiantes. ${e.message}`;
      }
      
      // Cargar lista de grados
      try {
        const resGrados = await fetch(`${BASE_URL}/grados.php`);
        if (!resGrados.ok) throw new Error(`HTTP ${resGrados.status} al cargar grados`);
        const loadedGrados = await resGrados.json();
        // Mapear y convertir id_grado a número entero, crucial para el filtro
        this.grados = loadedGrados.map(g => ({ ...g, id_grado: parseInt(g.id_grado) }));
      } catch (e) {
        console.error("Error cargando grados:", e);
        this.errorMessage = `Error al cargar la lista de grados. ${e.message}`;
      }
    },

    async fetchData() {
      this.errorMessage = "";
      try {
        const res = await fetch(`${BASE_URL}/asistencia.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar asistencias`);
        const loadedAsistencias = await res.json();
        
        // Mapear y convertir los IDs a número entero para Vue
        this.asistencias = loadedAsistencias.map(a => ({
          ...a,
          id_asistencia: parseInt(a.id_asistencia),
          grado_id: parseInt(a.grado_id), // Aseguramos que sea número para el filtro
        }));

      } catch (e) {
        console.error("Error en fetchData (Asistencias):", e);
        this.errorMessage = `No se pudieron cargar los datos de asistencias. Detalle: ${e.message}`;
      }
    },

    editItem(item) {
      this.editedIndex = this.asistencias.indexOf(item);
      this.editedItem = {
        id_asistencia: item.id_asistencia,
        NIE: item.NIE,
        grado_id: item.grado_id,
        fecha: item.fecha,
        estado: item.estado,
        nombre_estudiante: item.nombre_estudiante,
        nombre_grado: item.nombre_grado,
      };
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar la asistencia de "${item.nombre_estudiante}" (${item.fecha})?`)) return; 

      try {
        const res = await fetch(`${BASE_URL}/asistencias.php?id=${item.id_asistencia}`, { method: "DELETE" });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        this.asistencias.splice(this.asistencias.indexOf(item), 1);
        this.errorMessage = "";
      } catch (e) {
        console.error("Error al eliminar:", e);
        this.errorMessage = `Error al eliminar la asistencia: ${e.message}`;
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
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      const isUpdate = this.editedIndex > -1;
      
      const itemToSave = {
          NIE: this.editedItem.NIE,
          grado_id: this.editedItem.grado_id,
          fecha: this.editedItem.fecha,
          estado: this.editedItem.estado,
      };

      try {
        const url = isUpdate 
            ? `${BASE_URL}/asistencias.php?id=${this.editedItem.id_asistencia}` 
            : `${BASE_URL}/asistencias.php`;
        
        const method = isUpdate ? "PUT" : "POST";

        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemToSave),
        });
        
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido del servidor' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        
        this.fetchData(); // Recargar datos para actualizar la tabla
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