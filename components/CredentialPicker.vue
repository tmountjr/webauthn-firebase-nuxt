<template>
  <div class="credentialPicker">
    <b-row>
      <b-col>
        <h1>Available Credentials</h1>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <p class="mb-0">
          Notes:
          <ul>
            <li>These are the credentials that are registered to your account.</li>
            <li>Not all of these credentials may be available on this device.</li>
            <li>Clicking "Use" will allow you to use the specified credential when performing actions that require additional authorization.</li>
          </ul>
        </p>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <b-table head-variant="dark" :items="credentials" :fields="fields">
          <template #cell(credId)="data">
            {{ data.item.credentialIdSerialized.slice(0, 8) }}...
          </template>
          <template #cell(inUse)="data">
            {{ data.item.credentialIdSerialized === defaultCredId ? '✓' : '' }}
          </template>
          <template #cell(actions)="data">
            <b-button @click.prevent="setLocalCredId(data.item.credentialIdSerialized)">
              Use
            </b-button>
            <b-button @click.prevent="testCredential(data.item.credentialIdSerialized)">
              Test
            </b-button>
            <b-button variant="danger" @click.prevent="deleteCredential(data.item.credentialIdSerialized)">
              Delete
            </b-button>
          </template>
          <template v-if="showCaption" #table-caption>
            <MiniAlert :error-level="tableCaptionDetails.errorLevel" @mini-alert-dismissed="resetMiniAlert">
              {{ tableCaptionDetails.content }}
            </MiniAlert>
          </template>
        </b-table>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { startAuthentication } from '@simplewebauthn/browser'

export default {
  name: 'CredentialPickerComponent',
  data: () => ({
    fields: [
      { key: 'credId', label: 'CredID' },
      { key: 'credentialName', label: 'Credential Name' },
      { key: 'inUse', label: 'In use' },
      { key: 'actions', label: 'Actions' }
    ],
    showCaption: false,
    tableCaptionDetails: {
      errorLevel: 'danger',
      content: ''
    },
    defaultCredId: '',
    currentChallenge: ''
  }),
  computed: {
    ...mapState({
      credentials: state => state.credentials
    }),
    credInUse (credId) {
      const defaultCred = window.localStorage.getItem('activeCredential')
      return defaultCred === credId
    }
  },
  beforeMount () {
    this.defaultCredId = window.localStorage.getItem('activeCredential')
  },
  methods: {
    ...mapActions({
      deleteFirebaseCredential: 'deleteCredential'
    }),
    resetMiniAlert () {
      this.showCaption = false
      this.tableCaptionDetails.errorLevel = 'danger'
      this.tableCaptionDetails.content = ''
    },
    setLocalCredId (credId) {
      window.localStorage.setItem('activeCredential', credId)
      this.tableCaptionDetails.errorLevel = 'success'
      this.tableCaptionDetails.content = 'Successfully linked local credential. Please test it if you haven\'t yet.'
      this.showCaption = true
    },
    async deleteCredential (credId) {
      await this.deleteFirebaseCredential(credId)

      // Check local storage too, just to make sure
      const localCredId = window.localStorage.getItem('activeCredential')
      if (credId === localCredId) {
        window.localStorage.removeItem('activeCredential')
      }
    },
    async testCredential (credId) {
      let optsResponse
      try {
        optsResponse = await this.$axios('/auth/generate-authentication-options', {
          method: 'POST',
          data: {
            devices: this.credentials.filter(cred => cred.credentialIdSerialized === credId)
          },
          headers: {
            'content-type': 'application/json'
          }
        })
      } catch (e) {
        this.tableCaptionDetails.content = e.message
        this.showCaption = true
        return
      }

      const opts = optsResponse.data
      this.currentChallenge = opts.challenge

      let authCredResponse
      try {
        authCredResponse = await startAuthentication(opts)
      } catch (e) {
        this.tableCaptionDetails.content = e.message
        this.showCaption = true
        return
      }

      try {
        const verificationResp = await this.$axios('/auth/verify-authentication', {
          method: 'POST',
          data: {
            devices: this.credentials,
            currentChallenge: this.currentChallenge,
            body: authCredResponse
          },
          headers: {
            'content-type': 'application/json'
          }
        })

        const { verified } = verificationResp.data
        if (verified) {
          this.tableCaptionDetails.errorLevel = 'success'
          this.tableCaptionDetails.content = 'Successfully validated credential.'
        } else {
          this.tableCaptionDetails.errorLevel = 'danger'
          this.tableCaptionDetails.content = 'Unable to validate credential.'
        }
      } catch (e) {
        this.tableCaptionDetails.errorLevel = 'danger'
        this.tableCaptionDetails.content = `Error occurred: ${e}`
      } finally {
        this.showCaption = true
      }
    }
  }
}
</script>
