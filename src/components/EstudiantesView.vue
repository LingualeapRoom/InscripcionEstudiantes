<template>
<v-container>
<v-toolbar flat>
<v-toolbar-title>Mantenimiento de Estudiantes</v-toolbar-title>
<v-divider class="mx-4" inset vertical></v-divider>
<v-spacer></v-spacer>
<v-btn color="primary" dark class="mb-2" @click="openDialog('create')">
Nuevo Estudiante
</v-btn>
</v-toolbar>

<!-- Diálogo Principal de Creación/Edición -->
<v-dialog v-model="dialog" max-width="900px" persistent>
<v-card>
<v-card-title>
<span class="text-h5">{{ formTitle }}</span>
</v-card-title>
<v-card-text class="pt-4">
<v-form ref="form" v-model="valid" lazy-validation>
<v-tabs v-model="tab" color="primary">
<v-tab value="personal">Datos Personales</v-tab>
<v-tab value="contacto">Contacto & Dirección</v-tab>
<v-tab value="familia">Familia & Responsable</v-tab>
<v-tab value="salud">Salud & Habilidades</v-tab>
</v-tabs>

<v-window v-model="tab">
<!-- Pestaña 1: Datos Personales -->
<v-window-item value="personal" class="pa-4">
<v-row>
<v-col cols="12" sm="6" md="4">
<v-text-field
v-model="editedItem.NIE"
label="NIE (Clave Única)"
:rules="[v => !!v || 'El NIE es obligatorio']"
:disabled="editedIndex > -1"
required
></v-text-field>
</v-col>
<v-col cols="12" sm="6" md="8">
<v-text-field
v-model="editedItem.nombre_completo"
label="Nombre Completo"
:rules="[v => !!v || 'El nombre completo es obligatorio']"
required
></v-text-field>
</v-col>
<v-col cols="12" sm="6" md="4">
<v-text-field
v-model="editedItem.fecha_de_nacimiento"
label="Fecha de Nacimiento"
type="date"
:rules="[v => !!v || 'La fecha es obligatoria']"
required
></v-text-field>
</v-col>
<v-col cols="12" sm="6" md="4">
<v-select
v-model="editedItem.genero_del_alumno"
:items="['M', 'F', 'O']"
label="Género"
:rules="[v => !!v || 'El género es obligatorio']"
required
></v-select>
</v-col>
<v-col cols="12" sm="6" md="4">
<v-select
v-model="editedItem.estado_civil"
:items="[{ title: 'Soltero', value: 'S' }, { title: 'Casado', value: 'C' }, { title: 'Viudo', value: 'V' }, { title: 'Divorciado', value: 'D' }]"
item-title="title"
item-value="value"
label="Estado Civil"
></v-select>
</v-col>
<v-col cols="12" sm="6" md="6">
<v-text-field
v-model="editedItem.dui"
label="DUI (Opcional, Único)"
:rules="duiRules"
></v-text-field>
</v-col>
<v-col cols="12" sm="6" md="6">
<v-text-field
v-model="editedItem.lugar_de_nacimiento"
label="Lugar de Nacimiento"
></v-text-field>
</v-col>
<v-col cols="12" md="12">
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
</v-window-item>

<!-- Pestaña 2: Contacto & Dirección -->
<v-window-item value="contacto" class="pa-4">
<v-row>
<v-col cols="12" sm="6">
<v-text-field
v-model="editedItem.correo"
label="Correo Electrónico"
:rules="emailRules"
required
></v-text-field>
</v-col>
<v-col cols="12" sm="6">
<v-text-field
v-model="editedItem.telefono_personal"
label="Teléfono Personal"
:rules="telefonoRules"
></v-text-field>
</v-col>
<v-col cols="12" sm="6">
<v-text-field
v-model="editedItem.telefono_de_emergencia"
label="Teléfono de Emergencia"
:rules="telefonoRules"
></v-text-field>
</v-col>
<v-col cols="12" sm="6">
<v-text-field
v-model="editedItem.religion"
label="Religión"
></v-text-field>
</v-col>
<v-col cols="12">
<v-textarea
v-model="editedItem.direccion"
label="Dirección Completa"
rows="2"
></v-textarea>
</v-col>
</v-row>
</v-window-item>

<!-- Pestaña 3: Familia & Responsable -->
<v-window-item value="familia" class="pa-4">
<v-row>
<v-col cols="12" md="6">
<v-text-field
v-model="editedItem.nombre_papa"
label="Nombre del Padre"
></v-text-field>
</v-col>
<v-col cols="12" md="6">
<v-text-field
v-model="editedItem.nombre_mama"
label="Nombre de la Madre"
></v-text-field>
</v-col>
<v-col cols="12" md="12">
<v-text-field
v-model="editedItem.nombre_responsable"
label="Nombre del Responsable Legal (Si aplica)"
></v-text-field>
</v-col>
</v-row>
</v-window-item>

<!-- Pestaña 4: Salud & Habilidades -->
<v-window-item value="salud" class="pa-4">
<v-row>
<v-col cols="12" md="4">
<v-switch
v-model="editedItem.enfermedad_si_no"
label="¿Padece alguna enfermedad?"
color="primary"
inset
></v-switch>
</v-col>
<v-col cols="12" md="8">
<v-text-field
v-model="editedItem.enfermedad_especifique"
label="Especifique la enfermedad (si aplica)"
:disabled="!editedItem.enfermedad_si_no"
:rules="editedItem.enfermedad_si_no ? [v => !!v || 'Debe especificar la enfermedad'] : []"
></v-text-field>
</v-col>
<v-col cols="12">
<v-textarea
v-model="editedItem.habilidades"
label="Habilidades / Talentos Destacados"
rows="3"
></v-textarea>
</v-col>
</v-row>
</v-window-item>
</v-window>

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

<!-- Diálogo de Detalles (Solo lectura) -->
<v-dialog v-model="detailsDialog" max-width="600px">
<v-card>
<v-card-title class="bg-primary text-white">
Detalles de {{ viewedItem.nombre_completo }}
</v-card-title>
<v-card-text class="pt-6">
<v-list density="compact">
<v-list-item title="NIE" :subtitle="viewedItem.NIE"></v-list-item>
<v-list-item title="Correo" :subtitle="viewedItem.correo"></v-list-item>
<v-list-item title="Fecha de Nacimiento" :subtitle="viewedItem.fecha_de_nacimiento"></v-list-item>
<v-list-item title="Lugar de Nacimiento" :subtitle="viewedItem.lugar_de_nacimiento || 'N/A'"></v-list-item>
<v-list-item title="Género" :subtitle="getGenero(viewedItem.genero_del_alumno)"></v-list-item>
<v-list-item title="Estado Civil" :subtitle="getEstadoCivil(viewedItem.estado_civil)"></v-list-item>
<v-divider></v-divider>
<v-list-item title="Teléfono Personal" :subtitle="viewedItem.telefono_personal || 'N/A'"></v-list-item>
<v-list-item title="Teléfono Emergencia" :subtitle="viewedItem.telefono_de_emergencia || 'N/A'"></v-list-item>
<v-list-item title="Dirección" :subtitle="viewedItem.direccion || 'N/A'"></v-list-item>
<v-divider></v-divider>
<v-list-item title="Nombre del Padre" :subtitle="viewedItem.nombre_papa || 'N/A'"></v-list-item>
<v-list-item title="Nombre de la Madre" :subtitle="viewedItem.nombre_mama || 'N/A'"></v-list-item>
<v-list-item title="Responsable Legal" :subtitle="viewedItem.nombre_responsable || 'N/A'"></v-list-item>
<v-list-item title="Religión" :subtitle="viewedItem.religion || 'N/A'"></v-list-item>
<v-list-item title="DUI" :subtitle="viewedItem.dui || 'N/A'"></v-list-item>
<v-divider></v-divider>
<v-list-item :title="viewedItem.enfermedad_si_no ? 'Enfermedad: Sí' : 'Enfermedad: No'"
:subtitle="viewedItem.enfermedad_especifique || 'Ninguna especificada'"></v-list-item>
<v-list-item title="Habilidades" :subtitle="viewedItem.habilidades || 'N/A'"></v-list-item>
<v-list-item title="Sección Asignada" :subtitle="getNombreSeccion(viewedItem.seccion_id)"></v-list-item>
</v-list>
</v-card-text>
<v-card-actions>
<v-spacer></v-spacer>
<v-btn color="blue-darken-1" variant="text" @click="detailsDialog = false">Cerrar</v-btn>
</v-card-actions>
</v-card>
</v-dialog>

<!-- Tabla de Datos -->
<v-data-table
:headers="headers"
:items="estudiantes"
:sort-by="[{ key: 'NIE', order: 'asc' }]"
class="elevation-1 mt-4"
>
<template v-slot:item.index="{ index }">{{ index + 1 }}</template>

<!-- Se removió el slot de NIE, dejando que Vuetify lo mapee por 'value: "NIE"' -->

<!-- Usamos la función auxiliar para mostrar el nombre de la sección completa -->
<template v-slot:item.seccion_asignada="{ item }">{{ getNombreSeccion(item.seccion_id) }}</template>

<template v-slot:item.actions="{ item }">
<v-icon size="small" class="me-2" @click="viewItem(item)">mdi-eye</v-icon>
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

const BASE_URL = "http://localhost/api_proyecto_final";

export default {
data: () => ({
tab: null, // Para manejar las pestañas del formulario
dialog: false,
detailsDialog: false,
valid: true,
errorMessage: "",
headers: [
{ title: "N°", value: "index", sortable: false, width: "5%" },
{ title: "NIE", value: "NIE", width: "15%" },
{ title: "Nombre Completo", value: "nombre_completo", width: "35%" },
{ title: "Género", value: "genero_del_alumno", width: "10%" },
{ title: "Sección", value: "seccion_asignada", sortable: false, width: "20%" },
{ title: "Acciones", value: "actions", sortable: false, width: "15%" },
],
estudiantes: [],
secciones: [],
grados: [],
editedIndex: -1,
// Modelo de datos completo, mapeado a la tabla SQL
editedItem: {
NIE: "",
correo: "",
nombre_completo: "",
fecha_de_nacimiento: new Date().toISOString().substring(0, 10),
lugar_de_nacimiento: "",
genero_del_alumno: null, // M, F, O
estado_civil: null,    // S, C, V, D
direccion: "",
telefono_personal: "",
telefono_de_emergencia: "",
nombre_papa: "",
nombre_mama: "",
nombre_responsable: "",
religion: "",
dui: "",
enfermedad_si_no: false,
enfermedad_especifique: "",
habilidades: "",
seccion_id: null,
},
defaultItem: {
NIE: "",
correo: "",
nombre_completo: "",
fecha_de_nacimiento: new Date().toISOString().substring(0, 10),
lugar_de_nacimiento: "",
genero_del_alumno: null,
estado_civil: null,
direccion: "",
telefono_personal: "",
telefono_de_emergencia: "",
nombre_papa: "",
nombre_mama: "",
nombre_responsable: "",
religion: "",
dui: "",
enfermedad_si_no: false,
enfermedad_especifique: "",
habilidades: "",
seccion_id: null,
},
viewedItem: {},
emailRules: [
v => !!v || 'El correo es obligatorio',
v => /.+@.+\..+/.test(v) || 'El correo debe ser válido',
],
telefonoRules: [
v => !v || /^\d{4}-\d{4}$/.test(v) || /^\d{8}$/.test(v) || 'Formato de teléfono no válido (ej: 1234-5678 o 12345678)',
],
duiRules: [
v => !v || /^\d{8}-\d{1}$/.test(v) || 'Formato de DUI no válido (ej: 12345678-9)',
],
}),

computed: {
formTitle() {
return this.editedIndex === -1 ? "Nuevo Estudiante" : "Editar Estudiante";
},
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
if (val && this.$refs.form) {
// Al abrir, forzamos a la primera pestaña
this.tab = 'personal';
this.$refs.form.resetValidation();
}
},
},

created() {
this.fetchData();
},

methods: {
async fetchData() {
this.errorMessage = "";
try {
// 1. Cargar Grados
const gradosRes = await fetch(`${BASE_URL}/grados.php`);
this.grados = await gradosRes.json();

// 2. Cargar Secciones
const seccionesRes = await fetch(`${BASE_URL}/secciones.php`);
this.secciones = await seccionesRes.json();

// 3. Cargar Estudiantes
const estudiantesRes = await fetch(`${BASE_URL}/estudiantes.php`);
this.estudiantes = await estudiantesRes.json().then(data => data.map(item => ({
...item,
// Aseguramos que la fecha esté en formato YYYY-MM-DD para el input type="date"
fecha_de_nacimiento: item.fecha_de_nacimiento.substring(0, 10),
// Convertir el campo BOOLEAN/TINYINT(1) a booleano
enfermedad_si_no: item.enfermedad_si_no == 1,
})));

} catch (e) {
console.error("Error al cargar datos:", e);
this.errorMessage = "No se pudieron cargar los datos (Estudiantes, Secciones o Grados). Revisa tu API.";
}
},

getNombreSeccion(id) {
if (!id) return "N/A";
const seccion = this.secciones.find((s) => s.id_seccion === id);
if (!seccion) return "Sección Desconocida";

const grado = this.grados.find((g) => g.id_grado === seccion.grado_id);
const nombreGrado = grado ? `${grado.grado} (${grado.anio_lectivo})` : 'Grado Desconocido';

return `${nombreGrado} - Sección ${seccion.nombre_seccion}`;
},

getGenero(g) {
if (!g) return 'N/A';
const map = { M: 'Masculino', F: 'Femenino', O: 'Otro' };
return map[g] || g;
},

getEstadoCivil(ec) {
if (!ec) return 'N/A';
const map = { S: 'Soltero', C: 'Casado', V: 'Viudo', D: 'Divorciado' };
return map[ec] || ec;
},

openDialog(type) {
if (type === 'create') {
this.editedItem = Object.assign({}, this.defaultItem);
this.editedIndex = -1;
}
this.dialog = true;
},

editItem(item) {
this.editedIndex = this.estudiantes.findIndex(e => e.NIE === item.NIE);
this.editedItem = Object.assign({}, item);
this.openDialog('edit');
nextTick(() => this.$refs.form.resetValidation());
},

viewItem(item) {
this.viewedItem = Object.assign({}, item);
this.detailsDialog = true;
},

async deleteItem(item) {
if (!confirm(`¿Estás seguro de eliminar a ${item.nombre_completo} (NIE: ${item.NIE})?`)) return;
try {
const res = await fetch(`${BASE_URL}/estudiantes.php?nie=${item.NIE}`, { method: "DELETE" });
if (!res.ok) throw new Error(`HTTP ${res.status}`);

this.estudiantes.splice(this.estudiantes.findIndex(e => e.NIE === item.NIE), 1);
} catch (e) {
console.error(e);
this.errorMessage = "Error al eliminar el estudiante.";
}
},

close() {
this.dialog = false;
this.$refs.form.validate().catch(() => {}); // Intentar validar para borrar mensajes de error
this.editedItem = Object.assign({}, this.defaultItem);
this.editedIndex = -1;
this.errorMessage = "";
},

async save() {
this.errorMessage = "";
const { valid } = await this.$refs.form.validate();
if (!valid) return;

const itemToSave = { ...this.editedItem };

// Asegurar que seccion_id sea un entero y enfermedad_si_no sea 0 o 1
itemToSave.seccion_id = parseInt(itemToSave.seccion_id);
itemToSave.enfermedad_si_no = itemToSave.enfermedad_si_no ? 1 : 0;

try {
const res = await fetch(
this.editedIndex > -1
? `${BASE_URL}/estudiantes.php?nie=${itemToSave.NIE}`
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