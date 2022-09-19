<template>
  <div class="addCredential">
    <b-row>
      <b-col>
        <h1>Register New Credential</h1>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <b-input-group>
          <b-form-input v-model="newCredentialName" />
          <b-input-group-append>
            <b-button @click="startRegisterCredential">
              Register Credential
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>

    <b-row v-if="showCaption" class="mt-1">
      <b-col>
        <MiniAlert :error-level="captionDetails.errorLevel" @mini-alert-dismissed="resetMiniAlert">
          {{ captionDetails.content }}
        </MiniAlert>
      </b-col>
    </b-row>
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
    newCredentialName: '',
    showCaption: false,
    captionDetails: {
      errorLevel: 'danger',
      content: ''
    }
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

      try {
        const cred = await window.navigator.credentials.create({ publicKey: options })
        const newCredential = await registerResponse({
          user: { ...this.authUser, credentials: this.credentials },
          rawCredential: cred,
          credentialName: this.newCredentialName
        })
        // userResp.credentials contains what should be the new list of credentials.
        if (newCredential) {
          await this.createCredential(newCredential)

          // Save the credential locally.
          window.localStorage.setItem('credId', cred.id)
        }
      } catch (e) {
        this.captionDetails.content = `Unable to register new credential: "${e.message}"`
        this.showCaption = true
      } finally {
        this.newCredentialName = ''
      }
    },
    resetMiniAlert () {
      this.showCaption = false
      this.captionDetails.errorLevel = 'danger'
      this.captionDetails.content = ''
    }
  }
}
</script>