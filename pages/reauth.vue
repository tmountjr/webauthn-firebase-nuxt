<template>
  <b-container class="reauth">
    <b-button :disabled="reauthUnavailable" @click="startReauth">
      Start Reauth
    </b-button>
  </b-container>
</template>

<script>
import base64url from 'base64url'
import { mapState, mapGetters } from 'vuex'
import { signinRequest, signinResponse } from '@/lib/auth'

export default {
  name: 'ReauthPage',
  data: () => ({
    credentials: []
  }),
  async fetch () {
    await this.readFirebaseCredentials()
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    ...mapGetters({
      isLoggedIn: 'isLoggedIn'
    }),
    reauthUnavailable () {
      return this.credentials.length === 0
    }
  },
  methods: {
    async startReauth () {
      const credId = localStorage.getItem('credId')

      // Fetch /auth/signinRequest
      const options = signinRequest({
        user: {
          ...this.authUser,
          credentials: this.credentials
        },
        credId
      })

      if (options.allowCredentials.length === 0) {
        console.info('No registered credentials found.')
        return null
      }

      options.challenge = base64url.toBuffer(options.challenge)

      for (const cred of options.allowCredentials) {
        cred.id = base64url.toBuffer(cred.id)
      }

      const cred = await navigator.credentials.get({
        publicKey: options
      })

      const credential = {}
      credential.id = cred.id
      credential.type = cred.type
      credential.rawId = base64url.encode(cred.rawId)

      if (cred.response) {
        const clientDataJSON = base64url.encode(cred.response.clientDataJSON)
        const authenticatorData = base64url.encode(cred.response.authenticatorData)
        const signature = base64url.encode(cred.response.signature)
        const userHandle = base64url.encode(cred.response.userHandle)
        credential.response = {
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle
        }
      }

      // fetch /auth/signinResponse with credential
      const resp = await signinResponse({
        user: { ...this.authUser, credentials: this.credentials },
        credentialObject: credential
      })
      if (!resp) {
        alert('failed authentication')
      } else {
        alert('authentication succeeded')
      }
    },
    async readFirebaseCredentials () {
      const ref = this.$fire.database.ref(`users/${this.authUser.uid}/credentials`)
      const snapshot = await ref.once('value')
      this.credentials = snapshot.val() || []
    }
  }
}
</script>
