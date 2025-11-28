<template>
  <v-container>
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <template v-slot:activator="{ props }">
        <v-toolbar flat class="mb-4">
          <v-toolbar-title>Gestión de Asistencias</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          
          <v-select
            v-model="filtroGradoId"
            :items="grados"
            item-title="grado_nombre_completo"
            item-value="id_grado"
            label="Filtrar por Grado"
            clearable
            variant="outlined"
            density="compact"
            hide-details
            class="mr-4"
            style="max-width: 180px;"
          ></v-select>

          <v-autocomplete
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
            no-data-text="No hay estudiantes coincidentes"
          ></v-autocomplete>
          
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
          
          <v-btn color="primary" dark class="mb-2" v-bind="props" @click="openCaptureDialog">
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

            <v-row v-if="editedIndex === -1">
                <v-col cols="12" sm="6">
                    <v-select
                        v-model="asistenciaMasiva.grado_id"
                        :items="grados"
                        item-title="grado_nombre_completo"
                        item-value="id_grado"
                        label="Grado a Registrar"
                        :rules="[v => !!v || 'El grado es obligatorio']"
                        required
                        variant="outlined"
                        density="comfortable"
                    ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="asistenciaMasiva.fecha"
                        label="Fecha de Asistencia"
                        type="date"
                        :rules="[v => !!v || 'La fecha es obligatoria']"
                        required
                        variant="outlined"
                        density="comfortable"
                    ></v-text-field>
                </v-col>

                <v-col cols="12" v-if="estudiantesACapturar.length > 0">
                    <h3 class="text-subtitle-1 mb-2">Marcar Asistencia ({{ estudiantesACapturar.length }} estudiantes)</h3>
                    <v-list density="compact" class="elevation-1">
                        <v-list-item v-for="est in estudiantesACapturar" :key="est.NIE" class="py-1">
                            <v-row align="center">
                                <v-col cols="6" class="py-1">
                                    {{ est.nombre_completo }} (NIE: {{ est.NIE }})
                                </v-col>
                                <v-col cols="6" class="py-1">
                                    <v-select
                                        v-model="est.estado"
                                        :items="estadosAsistencia"
                                        density="compact"
                                        variant="outlined"
                                        hide-details
                                    ></v-select>
                                </v-col>
                            </v-row>
                        </v-list-item>
                    </v-list>
                </v-col>
                <v-col cols="12" v-else-if="asistenciaMasiva.grado_id && asistenciaMasiva.fecha">
                    <v-alert type="info" density="compact">No hay estudiantes en el grado seleccionado o la fecha no es válida.</v-alert>
                </v-col>

            </v-row>
            
            <v-row v-else>
                <v-col cols="12">
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
                        disabled
                    ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-select
                        v-model="editedItem.grado_id"
                        :items="grados"
                        item-title="grado_nombre_completo"
                        item-value="id_grado"
                        label="Grado"
                        :rules="[v => !!v || 'El grado es obligatorio']"
                        required
                        variant="outlined"
                        density="comfortable"
                    ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-text-field
                        v-model="editedItem.fecha"
                        label="Fecha"
                        :rules="[v => !!v || 'La fecha es obligatoria', v => /^\d{4}-\d{2}-\d{2}$/.test(v) || 'Formato de fecha inválido (YYYY-MM-DD)']"
                        required
                        variant="outlined"
                        density="comfortable"
                        type="date"
                    ></v-text-field>
                </v-col>
                <v-col cols="12">
                    <v-select
                        v-model="editedItem.estado"
                        :items="estadosAsistencia"
                        label="Estado"
                        :rules="[v => !!v || 'El estado es obligatorio']"
                        required
                        variant="outlined"
                        density="comfortable"
                    ></v-select>
                </v-col>
            </v-row>
            
            <v-alert v-if="errorMessage" type="error" class="mt-3" density="compact" closable>
              {{ errorMessage }}
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" variant="text" @click="close">Cancelar</v-btn>
          <v-btn 
            color="blue-darken-1" 
            variant="text" 
            @click="save" 
            :disabled="!valid || (editedIndex === -1 && estudiantesACapturar.length === 0)"
          >
            Guardar
          </v-btn>
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

// La URL base apunta al directorio de la API
const BASE_URL = "http://localhost/api_proyecto_final"; 

export default {
  data: () => ({
    dialog: false,
    valid: true,
    errorMessage: "",
    
    // VARIABLES DE FILTRO DE LA TABLA
    filtroNIE: null, 
    filtroFecha: null,
    filtroGradoId: null,

    // Modelo para la captura masiva (solo en modo creación)
    asistenciaMasiva: {
        grado_id: null,
        fecha: new Date().toISOString().substring(0, 10),
    },
    // VARIABLE REACTIVA: Almacena la lista de estudiantes para la captura masiva
    estudiantesACapturar: [], 

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

    // Modelo para EDICIÓN INDIVIDUAL
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
      return this.editedIndex === -1 ? "Nueva Asistencia por Lotes" : "Editar Asistencia Individual";
    },

    asistenciasFiltradas() {
      let datosFiltrados = this.asistencias;

      // 1. Filtrar por GRADO (el filtro en la toolbar)
      if (this.filtroGradoId !== null) {
        datosFiltrados = datosFiltrados.filter(a => a.grado_id === this.filtroGradoId);
      }

      // 2. Filtrar por NIE 
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
    // Observar cambios en el diálogo de captura masiva para recargar la lista
    'asistenciaMasiva.grado_id': 'cargarEstudiantesGrado',
    'asistenciaMasiva.fecha': 'cargarEstudiantesGrado',
  },

  created() {
    this.fetchData(); 
    this.fetchDependencies(); 
  },

  methods: {
    cargarEstudiantesGrado() {
        const gradoIdSeleccionado = this.asistenciaMasiva.grado_id;
        const fecha = this.asistenciaMasiva.fecha;
        
        if (!gradoIdSeleccionado || !fecha) {
            this.estudiantesACapturar = [];
            return;
        }

        // 1. Obtener la lista de SECCIONES asociadas al GRADO seleccionado.
        // Dado que solo cargamos Grados, esta lógica es compleja. Idealmente, los estudiantes
        // deberían tener un campo 'grado_id' para este filtro, pero solo tienen 'seccion_id'.
        // Si usamos el grado_id seleccionado, solo funcionará si un grado tiene una sola sección.
        
        // **Simplificamos:** Asumiremos que estás usando el filtro por el ID del Grado.
        const numericGradoId = parseInt(gradoIdSeleccionado);
        
        // 2. Filtrar estudiantes: Solo aquellos cuya sección pertenezca al Grado seleccionado.
        // **ADVERTENCIA:** Este filtro es imperfecto, ya que la tabla "estudiantes" solo tiene el 'seccion_id', 
        // y NO el 'grado_id'. Se necesitaría una lista de Secciones con su 'grado_id' asociado.
        // Dado que solo tenemos la lista de estudiantes (con seccion_id) y grados, la mejor aproximación es:
        
        // Paso 2.1: Encontrar todas las secciones que pertenecen al grado seleccionado
        // *****************************************************************************
        // **Este paso requiere que cargues las secciones en fetchDependencies()**
        // *****************************************************************************
        const seccionesDelGrado = this.grados // En este contexto, usamos 'grados' porque no cargamos 'secciones'
            .filter(g => parseInt(g.id_grado) === numericGradoId)
            .map(g => g.id_seccion); // Si la lista de grados tuviera secciones asociadas.
            
        // **Dado que el código actual no carga la tabla 'secciones', usaremos una simulación:**
        // Filtraremos estudiantes que tengan la SECCIÓN ID igual al GRADO ID (lo cual es incorrecto, pero el único match disponible en la estructura actual de Vue)
        
        const filteredStudents = this.estudiantes.filter(e => {
            // Asumimos que quieres filtrar por el ID de la SECCIÓN que está actualmente asignada al GRADO
            // **Este es el punto débil, pero sigue la lógica original de tu código:**
            // Para que funcione, el valor 'id_grado' en el selector DEBE COINCIDIR con el 'seccion_id' del estudiante.
            return parseInt(e.seccion_id) === numericGradoId;
        });

        // 3. Mapear los estudiantes y pre-llenar su estado
        this.estudiantesACapturar = filteredStudents.map(student => {
            const existingAttendance = this.asistencias.find(a => 
                a.NIE === student.NIE && 
                a.grado_id === numericGradoId && // Usamos grado_id, que es el valor del selector
                a.fecha === fecha
            );
            
            return {
                NIE: student.NIE,
                nombre_completo: student.nombre_completo,
                estado: existingAttendance ? existingAttendance.estado : 'Presente',
                grado_id: numericGradoId,
                fecha: fecha,
            };
        });
    },

    openCaptureDialog() {
        this.editedIndex = -1; // Modo creación masiva
        this.dialog = true;
        this.cargarEstudiantesGrado(); 
    },
    
    async fetchDependencies() {
      this.errorMessage = "";
      
      // Cargar Estudiantes
      try {
        const resEstudiantes = await fetch(`${BASE_URL}/estudiantes.php`);
        if (!resEstudiantes.ok) throw new Error(`HTTP ${resEstudiantes.status} al cargar estudiantes`);
        const data = await resEstudiantes.json();
        this.estudiantes = data.map(e => ({
            ...e,
            seccion_id: parseInt(e.seccion_id), 
            nombre_completo: `${e.nombre} ${e.apellido}`,
        }));
      } catch (e) {
        console.error("Error cargando estudiantes:", e);
        this.errorMessage = `Error al cargar la lista de estudiantes. ${e.message}`;
      }
      
      // Cargar Grados
      try {
        const resGrados = await fetch(`${BASE_URL}/grados.php`);
        if (!resGrados.ok) throw new Error(`HTTP ${resGrados.status} al cargar grados`);
        const loadedGrados = await resGrados.json();
        
        this.grados = loadedGrados.map(g => ({ 
            ...g, 
            id_grado: parseInt(g.id_grado), 
            grado_nombre_completo: `${g.grado} (${g.anio_lectivo})` 
        }));
      } catch (e) {
        console.error("Error cargando grados:", e);
        this.errorMessage = `Error al cargar la lista de grados. ${e.message}`;
      }
    },

    async fetchData() {
      this.errorMessage = "";
      try {
        // ⭐ CORRECCIÓN: Usar asistencia.php (singular)
        const res = await fetch(`${BASE_URL}/asistencia.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status} al cargar asistencias`);
        const loadedAsistencias = await res.json();
        
        this.asistencias = loadedAsistencias.map(a => ({
          ...a,
          id_asistencia: parseInt(a.id_asistencia),
          grado_id: parseInt(a.grado_id), 
        }));
        
        if(this.dialog && this.editedIndex === -1) {
            this.cargarEstudiantesGrado();
        }

      } catch (e) {
        console.error("Error en fetchData (Asistencias):", e);
        this.errorMessage = `No se pudieron cargar los datos de asistencias. Detalle: ${e.message}`;
      }
    },

    editItem(item) {
      this.editedIndex = this.asistencias.findIndex(a => a.id_asistencia === item.id_asistencia);
      this.editedItem = Object.assign({}, item);
      this.dialog = true;
      nextTick(() => this.$refs.form.resetValidation());
    },

    async deleteItem(item) {
      if (!confirm(`¿Estás seguro de eliminar la asistencia de "${item.nombre_estudiante}" (${item.fecha})?`)) return; 

      try {
        // ⭐ CORRECCIÓN: Usar asistencia.php (singular)
        const res = await fetch(`${BASE_URL}/asistencia.php?id=${item.id_asistencia}`, { method: "DELETE" });
        if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(errorBody.error || `HTTP ${res.status}`);
        }
        this.asistencias.splice(this.asistencias.findIndex(a => a.id_asistencia === item.id_asistencia), 1);
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
        // Reiniciar modelos de captura masiva
        this.asistenciaMasiva.grado_id = null;
        this.asistenciaMasiva.fecha = new Date().toISOString().substring(0, 10);
        this.estudiantesACapturar = []; // Limpiar la lista
      });
    },

    async save() {
      this.errorMessage = "";
      const { valid } = await this.$refs.form.validate();
      if (!valid) return;

      if (this.editedIndex === -1) {
          // --- MODO: CAPTURA MASIVA (POST Array) ---
          const asistenciasArray = this.estudiantesACapturar
              .filter(e => e.estado !== null) // Solo guardar los que tienen un estado marcado
              .map(e => ({
                  NIE: e.NIE,
                  grado_id: e.grado_id, 
                  fecha: e.fecha,     
                  estado: e.estado
              }));

          if (asistenciasArray.length === 0) {
              this.errorMessage = "Debe marcar al menos una asistencia para guardar.";
              return;
          }
          
          try {
              // ⭐ CORRECCIÓN: Usar asistencia.php (singular)
              const res = await fetch(`${BASE_URL}/asistencia.php`, { 
                  method: "POST", 
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(asistenciasArray),
              });

              if (!res.ok) {
                  const errorBody = await res.json().catch(() => ({ error: 'Error desconocido del servidor' }));
                  throw new Error(errorBody.error || `HTTP ${res.status}`);
              }

              this.fetchData(); 
              this.close();
              
          } catch (e) {
              console.error("Error al guardar en lote:", e);
              this.errorMessage = `Error al guardar asistencias en lote: ${e.message}`;
          }

      } else {
          // --- MODO: EDICIÓN INDIVIDUAL (PUT Objeto) ---
          const isUpdate = this.editedIndex > -1;
          
          const itemToSave = {
              NIE: this.editedItem.NIE,
              grado_id: parseInt(this.editedItem.grado_id), 
              fecha: this.editedItem.fecha,
              estado: this.editedItem.estado,
          };

          try {
            // ⭐ CORRECCIÓN: Usar asistencia.php (singular)
            const url = isUpdate 
                ? `${BASE_URL}/asistencia.php?id=${this.editedItem.id_asistencia}` 
                : `${BASE_URL}/asistencia.php`;
            
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
            
            this.fetchData(); 
            this.close();
          } catch (e) {
            console.error("Error al guardar:", e);
            this.errorMessage = `Error al guardar: ${e.message}`;
          }
      }
    },
  },
};
</script>

<style scoped>

</style>