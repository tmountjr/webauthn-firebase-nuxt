<template>
  <div class="credentials">
    <hr>
    <h1>Credentials</h1>
    <b-button @click="addCredential">
      Add Credential
    </b-button>
    <div v-if="!hasCredentials">
      <p>No credentials stored.</p>
    </div>
    <div v-else>
      <p>Here are your credentials:</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'CredentialsComponent',
  props: {
    currentUser: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data () {
    return {
      credentials: []
    }
  },
  async fetch () {
    const ref = this.$fire.database.ref(`users/${this.authUser.uid}`)
    const snapshot = await ref.once('value')
    const userData = snapshot.val()
    if (userData?.credentials) {
      this.credentials = userData.credentials
    }
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    ...mapGetters({
      isLoggedIn: 'isLoggedIn'
    }),
    hasCredentials () {
      return this.credentials.length > 0
    }
  },
  methods: {
    addCredential () {
      // Do nothing for now.
    }
  }
}
</script>
