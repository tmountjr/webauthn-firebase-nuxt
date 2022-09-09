<template>
  <div class="credentials">
    <hr>
    <h1>Credentials</h1>
    <b-button @click="showCredentialName">
      Add Credential
    </b-button>
    <b-input-group v-if="showNewCredential">
      <b-form-input v-model="newCredentialName" />
      <b-input-group-append>
        <b-button @click="startRegisterCredential">
          Register Credential
        </b-button>
      </b-input-group-append>
    </b-input-group>
    <div v-if="!hasCredentials">
      <p>No credentials stored.</p>
    </div>
    <div v-else>
      <p>Here are your credentials:</p>
      <ul>
        <li v-for="cred in credentials" :key="cred.credId">
          Credential ID: {{ cred.credId }}
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
  data: () => ({
    credentials: [],
    newCredentialName: '',
    showNewCredential: false
  }),
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
    showCredentialName () {
      this.newCredentialName = ''
      this.showNewCredential = true
    },
    async startRegisterCredential () {
      // Get information that the device needs to create credentials.
      const options = registerCredential({
        user: this.authUser,
        credentials: this.credentials
      })

      const cred = await window.navigator.credentials.create({ publicKey: options })

      // Save the credential locally.
      window.localStorage.setItem('credId', cred.id)

      try {
        const userResp = await registerResponse({
          user: { ...this.authUser, credentials: this.credentials },
          rawCredential: cred,
          credentialName: this.newCredentialName
        })

        this.credentials = userResp.credentials
        debugger
        await this.writeFirebaseCredentials()
        await this.readFirebaseCredentials()
      } catch (e) {
        console.error(e)
      } finally {
        this.newCredentialName = ''
        this.showNewCredential = false
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
