<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="6">
        <v-card elevation="5" class="h-100"> <v-carousel
            cycle
            height="100%" hide-delimiter-background
            show-arrows="hover"
          >
            <v-carousel-item
              v-for="(image, i) in carruselImages"
              :key="i"
              :src="require(`../assets/${image.src}`)"
              contain
            ></v-carousel-item>
          </v-carousel>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" class="d-flex flex-column justify-center align-center">
        
        <h1 class="text-h4 font-weight-bold mb-4 text-center">
          Bienvenido al Sistema de Control Estudiantil
        </h1>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'VistaBienvenida',

  data: () => ({
    carruselImages: [
      { src: '1.jpg' },
      { src: '2.jpg' },
      { src: '3.jpg' },
      { src: '4.jpg' },
    ],
  }),
};
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí si necesitas más control */
</style>