<template>
  <b-sidebar id="sidebar" right shadow>
    <div class="pt-4">
      <b-nav vertical>
        <b-nav-item to="/">
          <b-icon icon="house-door" />Dashboard
        </b-nav-item>
        <b-nav-item><b-icon icon="clipboard-data" />Reports</b-nav-item>
        <b-nav-item><b-icon icon="stack" />Integrations</b-nav-item>
      </b-nav>
      <p class="heading muted mt-4 mb-1 pl-3">
        User Settings
      </p>
      <b-nav vertical>
        <b-nav-item to="/profile">
          <b-icon icon="person" />Public Profile
        </b-nav-item>
        <b-nav-item to="/credential-manager">
          <b-icon icon="shield-lock" />Credential Manager
        </b-nav-item>
      </b-nav>
    </div>
  </b-sidebar>
</template>

<script>
export default {
  name: 'SidebarComponent'
}
</script>

<style lang="scss" scoped>
p.heading {
  font-size: 0.75rem;
  text-transform: uppercase;
}
.b-icon {
  margin-right: 0.5rem;
}

li.nav-item a {
  color: rgb(33, 37, 41);

  &.nuxt-link-exact-active {
    color: rgb(0, 123, 255);
  }
}
</style>
