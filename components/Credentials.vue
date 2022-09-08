<template>
  <div class="credentials">
    <hr>
    <h1>Credentials</h1>
    <b-button @click="startRegisterCredential">
      Add Credential
    </b-button>
    <div v-if="!hasCredentials">
      <p>No credentials stored.</p>
    </div>
    <div v-else>
      <p>Here are your credentials:</p>
      <ul>
        <li v-for="cred in credentials" :key="cred.publicKey">
          Public Key: {{ cred.publicKey }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import base64url from 'base64url'
import { registerCredential, registerResponse } from '@/lib/auth'

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
    await this.readFirebaseCredentials()
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    hasCredentials () {
      return this.credentials.length > 0
    }
  },
  methods: {
    async startRegisterCredential () {
      const options = registerCredential({
        user: this.authUser,
        credentials: this.credentials
      })

      options.user.id = base64url.toBuffer(options.user.id)
      options.challenge = base64url.toBuffer(options.challenge)

      if (options.excludeCredentials) {
        for (const cred of options.excludeCredentials) {
          cred.id = base64url.toBuffer(cred.id)
        }
      }

      const cred = await window.navigator.credentials.create({ publicKey: options })
      const credential = {}
      credential.id = cred.id
      credential.rawId = base64url.encode(cred.rawId)
      credential.type = cred.type

      if (cred.response) {
        const clientDataJSON = base64url.encode(cred.response.clientDataJSON)
        const attestationObject = base64url.encode(cred.response.attestationObject)
        credential.response = {
          clientDataJSON,
          attestationObject
        }
      }

      window.localStorage.setItem('credId', credential.id)

      const userResp = await registerResponse({
        user: { ...this.authUser, credentials: this.credentials },
        credential
      })

      const credRef = this.$fire.database.ref(`users/${this.authUser.uid}/credentials`)
      await credRef.set(userResp.credentials)
      await this.readFirebaseCredentials()
    },
    async readFirebaseCredentials () {
      const ref = this.$fire.database.ref(`users/${this.authUser.uid}/credentials`)
      const snapshot = await ref.once('value')
      const credentials = snapshot.val()
      this.credentials = credentials || []
    }
  }
}
</script>
