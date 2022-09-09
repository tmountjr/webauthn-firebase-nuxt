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
          Credential ID: {{ cred.credId.slice(0, 8) }}... <br>
          Credential Name: {{ cred.credentialName }} <br>
          <b-button variant="danger" @click="deleteCredential(cred.credId)">
            <b-icon icon="trash" />
          </b-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
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
    newCredentialName: '',
    showNewCredential: false
  }),
  computed: {
    ...mapState({
      authUser: state => state.authUser,
      credentials: state => state.credentials
    }),
    hasCredentials () {
      return this.credentials.length > 0
    }
  },
  methods: {
    ...mapActions({
      createCredential: 'createCredential',
      deleteFirebaseCredential: 'deleteCredential'
    }),
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
        const newCredential = await registerResponse({
          user: { ...this.authUser, credentials: this.credentials },
          rawCredential: cred,
          credentialName: this.newCredentialName
        })
        // userResp.credentials contains what should be the new list of credentials.
        if (newCredential) {
          await this.createCredential(newCredential)
        }
      } catch (e) {
        console.error(e)
      } finally {
        this.newCredentialName = ''
        this.showNewCredential = false
      }
    },
    async deleteCredential (credId) {
      await this.deleteFirebaseCredential(credId)

      // Check local storage too, just to make sure
      const localCredId = window.localStorage.getItem('credId')
      if (credId === localCredId) {
        window.localStorage.removeItem('credId')
      }
    }
  }
}
</script>
