<template>
  <b-container class="login d-flex">
    <b-row class="justify-content-center align-content-center">
      <b-col cols="12" md="4">
        <Nuxt />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: 'LoginLayout'
}
</script>

<style scoped>
.login {
  padding-top: 40px;
  padding-bottom: 40px;
  text-align: center;
}
.row {
  flex-grow: 1;
}
</style>
