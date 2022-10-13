<!-- eslint-disable no-unused-vars -->
<template>
  <div class="addCredential">
    <b-row>
      <b-col>
        <h1>Register New Credential</h1>
      </b-col>
    </b-row>

    <div v-if="webauthnAvailable">
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

    <div v-else>
      <b-row>
        <b-col>
          <h2>Your browser does not support WebAuthn at this time.</h2>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

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
    },
    challenge: ''
  }),
  computed: {
    ...mapState({
      authUser: state => state.authUser,
      credentials: state => state.credentials
    }),
    hasCredentials () {
      return this.credentials.length > 0
    },
    webauthnAvailable () {
      return true
    }
  },
  methods: {
    ...mapActions({
      createCredential: 'createCredential'
    }),
    async startRegisterCredential () {
      const { startRegistration } = await import('@simplewebauthn/browser')

      let attResp
      try {
        const optsResponse = await this.$axios('/auth/generate-registration-options', {
          method: 'POST',
          data: {
            user: this.authUser,
            devices: this.credentials
          },
          headers: {
            'content-type': 'application/json'
          }
        })

        const opts = optsResponse.data
        this.challenge = opts.challenge

        opts.authenticatorSelection.residentKey = 'required'
        opts.authenticatorSelection.requireResidentKey = true
        opts.extensions = {
          credProps: true
        }

        attResp = await startRegistration(opts)
      } catch (e) {
        this.captionDetails.content = e.message
        this.showCaption = true
        return
      }

      const verificationResp = await this.$axios('/auth/verify-registration', {
        method: 'POST',
        data: {
          credential: attResp,
          devices: this.credentials,
          expectedChallenge: this.challenge
        },
        headers: {
          'content-type': 'application/json'
        }
      })

      const { verified, newDevice } = verificationResp.data
      const { credentialIdSerialized } = newDevice
      if (verified) {
        newDevice.credentialName = this.newCredentialName
        window.localStorage.setItem('activeCredential', credentialIdSerialized)
        await this.createCredential(newDevice)
        this.captionDetails.errorLevel = 'success'
        this.captionDetails.content = 'Successfully registered device!'
      } else {
        this.captionDetails.content = 'Unable to register device.'
      }
      this.showCaption = true
      this.newCredentialName = ''
    },
    resetMiniAlert () {
      this.showCaption = false
      this.captionDetails.errorLevel = 'danger'
      this.captionDetails.content = ''
    }
  }
}
</script>
