<template>
  <div class="sidebar pt-4 d-flex flex-column">
    <b-nav class="d-flex flex-column">
      <b-nav-item to="/"><b-icon icon="house-door" />Dashboard</b-nav-item>
      <b-nav-item><b-icon icon="clipboard-data" />Reports</b-nav-item>
      <b-nav-item><b-icon icon="stack" />Integrations</b-nav-item>
    </b-nav>
    <p class="heading muted mt-4 mb-1 pl-3">
      User Settings
    </p>
    <b-nav class="d-flex flex-column">
      <b-nav-item><b-icon icon="person" />Public Profile</b-nav-item>
      <b-nav-item><b-icon icon="shield-lock" />Private Settings</b-nav-item>
    </b-nav>
  </div>
</template>

<script>
export default {
  name: 'SidebarComponent'
}
</script>

<style scoped>
.sidebar {
  background-color: rgb(244, 244, 244);
  height: 100vh;
}
p.heading {
  font-size: 0.75rem;
  text-transform: uppercase;
}
.b-icon {
  margin-right: 0.5rem;
}

.nuxt-link-active {
  color: rgb(0, 123, 255);
}
</style>
