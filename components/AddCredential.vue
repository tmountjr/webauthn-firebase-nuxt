<template>
  <div class="addCredential">
    <div class="row">
      <h1>Register New Credential</h1>
    </div>

    <div class="row">
      <b-input-group>
        <b-form-input v-model="newCredentialName" />
        <b-input-group-append>
          <b-button @click="startRegisterCredential">
            Register Credential
          </b-button>
        </b-input-group-append>
      </b-input-group>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { registerCredential, registerResponse } from '@/lib/auth'

export default {
  name: 'AddCredentialComponent',
  props: {
    currentUser: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data: () => ({
    newCredentialName: ''
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
      createCredential: 'createCredential'
    }),
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
      }
    }
  }
}
</script>
