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
import { startRegistration } from '@simplewebauthn/browser'
// import { registerCredential, registerResponse } from '@/lib/auth'

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
      // return browserSupportsWebAuthn()
      return true
    }
  },
  methods: {
    ...mapActions({
      createCredential: 'createCredential'
    }),
    async startRegisterCredential () {
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
        // TODO: error handling
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

      console.log(attResp)

      const verificationJson = verificationResp.data
      if (verificationJson && verificationJson.verified) {
        alert('success!')
      } else {
        alert('failure')
        console.error(verificationJson)
      }

      // // Get information that the device needs to create credentials.
      // const options = registerCredential({
      //   user: this.authUser,
      //   credentials: this.credentials
      // })

      // try {
      //   const cred = await window.navigator.credentials.create({ publicKey: options })
      //   const newCredential = await registerResponse({
      //     user: { ...this.authUser, credentials: this.credentials },
      //     rawCredential: cred,
      //     credentialName: this.newCredentialName
      //   })
      //   // userResp.credentials contains what should be the new list of credentials.
      //   if (newCredential) {
      //     await this.createCredential(newCredential)

      //     // Save the credential locally.
      //     window.localStorage.setItem('credId', cred.id)
      //   }
      // } catch (e) {
      //   this.captionDetails.content = `Unable to register new credential: "${e.message}"`
      //   this.showCaption = true
      // } finally {
      //   this.newCredentialName = ''
      // }
    },
    resetMiniAlert () {
      this.showCaption = false
      this.captionDetails.errorLevel = 'danger'
      this.captionDetails.content = ''
    }
  }
}
</script>
