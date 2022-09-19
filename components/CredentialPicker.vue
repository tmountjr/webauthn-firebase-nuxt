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
            {{ data.value?.slice(0, 8) }}...
          </template>
          <template #cell(inUse)="data">
            {{ data.item.credId === defaultCredId ? '✓' : '' }}
          </template>
          <template #cell(actions)="data">
            <b-button @click.prevent="setLocalCredId(data.item.credId)">
              Use
            </b-button>
            <b-button @click.prevent="testCredential(data.item.credId)">
              Test
            </b-button>
            <b-button variant="danger" @click.prevent="deleteCredential(data.item.credId)">
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
import { signinRequest, signinResponse } from '@/lib/auth'

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
    defaultCredId: ''
  }),
  computed: {
    ...mapState({
      credentials: state => state.credentials
    }),
    credInUse (credId) {
      const defaultCred = window.localStorage.getItem('credId')
      return defaultCred === credId
    }
  },
  beforeMount () {
    this.defaultCredId = window.localStorage.getItem('credId')
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
      window.localStorage.setItem('credId', credId)
      this.tableCaptionDetails.errorLevel = 'success'
      this.tableCaptionDetails.content = 'Successfully linked local credential. Please test it if you haven\'t yet.'
      this.showCaption = true
    },
    async deleteCredential (credId) {
      await this.deleteFirebaseCredential(credId)

      // Check local storage too, just to make sure
      const localCredId = window.localStorage.getItem('credId')
      if (credId === localCredId) {
        window.localStorage.removeItem('credId')
      }
    },
    async testCredential (credId) {
      const options = signinRequest({
        user: { ...this.authUser, credentials: this.credentials },
        credId
      })

      const cred = await window.navigator.credentials.get({
        publicKey: options
      })

      try {
        const success = await signinResponse({
          user: { ...this.authUser, credentials: this.credentials },
          rawCredential: cred
        })
        if (success) {
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
