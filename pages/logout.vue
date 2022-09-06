<template>
  <b-container class="logout">
    <b-button @click="logout">
      Log Out
    </b-button>
  </b-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'LogoutPage',
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    ...mapGetters({
      isLoggedIn: 'isLoggedIn'
    })
  },
  methods: {
    async logout () {
      await this.$fire.auth.signOut()
      this.$router.push('/')
    }
  }
}
</script>
