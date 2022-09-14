<template>
  <b-navbar toggleable="lg" variant="dark" type="dark">
    <b-navbar-brand to="/">
      Webauthn Demo
    </b-navbar-brand>
    <b-navbar-nav class="ml-auto">
      <b-nav-item to="/logout" right>
        Sign Out
      </b-nav-item>
      <b-nav-form>
        <b-button v-b-toggle.sidebar>
          <b-icon icon="list" />
        </b-button>
      </b-nav-form>
    </b-navbar-nav>
  </b-navbar>
</template>

<script>
export default {
  name: 'NavbarComponent'
}
</script>
