<template>
  <b-container class="reauth">
    <b-button :disabled="reauthUnavailable" @click="startReauth">
      Start Reauth
    </b-button>
    <CredentialPicker v-if="showCredentialPicker" class="mt-2" />
  </b-container>
</template>

<script>
import base64url from 'base64url'
import { mapState, mapGetters } from 'vuex'
import { signinRequest, signinResponse } from '@/lib/auth'
import CredentialPicker from '@/components/CredentialPicker.vue'

export default {
  name: 'ReauthPage',
  components: {
    CredentialPicker
  },
  data: () => ({
    showCredentialPicker: false
  }),
  computed: {
    ...mapState({
      authUser: state => state.authUser,
      credentials: state => state.credentials
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
      const credId = window.localStorage.getItem('credId')

      if (!credId) {
        this.showCredentialPicker = true
      }

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
    }
  }
}
</script>
