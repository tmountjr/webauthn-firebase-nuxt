<template>
  <b-container class="logout">
    <p>Logging you out...</p>
  </b-container>
</template>

<script>
export default {
  name: 'LogoutPage',
  async mounted () {
    await this.$fire.auth.signOut()
    this.$cookies.remove('fbId')
    this.$router.push('/login')
  }
}
</script>
