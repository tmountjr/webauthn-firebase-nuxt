<template>
  <b-container fluid class="layout-container">
    <Navbar />
    <b-row>
      <Sidebar />
      <b-container>
        <Nuxt />
      </b-container>
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
