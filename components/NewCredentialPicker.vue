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
// const { startAuthentication, browserSupportsWebAuthn } = require('@simplewebauthn/browser')

export default {
  name: 'NewCredentialPickerComponent',
  data: () => ({
    defaultCredId: ''
  }),
  computed: {
    ...mapState({
      credentials: state => state.credentials
    })
  },
  beforeMount () {
    this.defaultCredId = window.localStorage.getItem('credId')
  },
  methods: {
    ...mapActions({
      deleteFirebaseCredential: 'deleteCredential'
    }),
    setLocalCredId (credId) {
      window.localStorage.setItem('credId', credId)
    },
    async deleteCredential (credId) {
      await this.deleteFirebaseCredential(credId)

      // Check local storage too, just to make sure.
      const localCredId = window.localStorage.getItem('credId')
      if (credId === localCredId) {
        window.localStorage.removeItem('credId')
      }
    },
    async testCredential (credId) {
      // ...
    }
  }
}
</script>
