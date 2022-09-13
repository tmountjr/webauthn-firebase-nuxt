<template>
  <b-container fluid class="layout-container">
    <Navbar />
    <b-row no-gutters>
      <b-col cols="2">
        <Sidebar />
      </b-col>
      <b-col>
        <Nuxt />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: 'DefaultLayout'
}
</script>

<style scoped>
.layout-container {
  padding: 0;
}
</style>
