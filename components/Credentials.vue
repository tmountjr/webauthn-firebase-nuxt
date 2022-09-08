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
        <li v-for="cred in credentials" :key="cred.credId">
          Public Key: {{ cred.credId }}
          <b-button variant="danger" @click="deleteCredential(cred.credId)">
            <b-icon icon="trash" />
          </b-button>
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

      try {
        const userResp = await registerResponse({
          user: { ...this.authUser, credentials: this.credentials },
          credential
        })

        this.credentials = userResp.credentials
        await this.writeFirebaseCredentials()
        await this.readFirebaseCredentials()
      } catch (e) {
        console.error(e)
      }
    },
    async readFirebaseCredentials () {
      const ref = this.$fire.database.ref(`users/${this.authUser.uid}/credentials`)
      const snapshot = await ref.once('value')
      const credentials = snapshot.val()
      this.credentials = credentials || []
    },
    async writeFirebaseCredentials () {
      const ref = this.$fire.database.ref(`users/${this.authUser.uid}/credentials`)
      await ref.set(this.credentials)
    },
    async deleteCredential (credId) {
      // Read in the latest from firebase, remove the one we want to remove, and
      // push back to firebase.
      await this.readFirebaseCredentials()
      this.credentials = this.credentials.filter(cred => cred.credId !== credId)
      await this.writeFirebaseCredentials()
      // Check local storage too, just to make sure
      const localCredId = window.localStorage.getItem('credId')
      if (credId === localCredId) {
        window.localStorage.removeItem('credId')
      }
    }
  }
}
</script>
