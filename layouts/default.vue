<template>
  <b-container fluid class="layout-container">
    <Navbar />
    <b-row>
      <Sidebar />
      <Nuxt />
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
