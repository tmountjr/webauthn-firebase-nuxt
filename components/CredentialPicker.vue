<template>
  <div class="credentialPicker">
    <div class="row">
      <h1>Available Credentials</h1>
    </div>

    <div class="row">
      <p class="mb-0">
        Notes:
        <ul>
          <li>These are the credentials that are registered to your account.</li>
          <li>Not all of these credentials may be available on this device.</li>
          <li>Clicking "Use" will allow you to use the specified credential when performing actions that require additional authorization.</li>
        </ul>
      </p>
    </div>

    <div class="row">
      <b-table head-variant="dark" :items="credentials" :fields="fields">
        <template #cell(credId)="data">
          {{ data.value?.slice(0, 8) }}...
        </template>
        <template #cell(actions)="data">
          <b-button @click.prevent="setLocalCredId(data.item.credId)">
            Use
          </b-button>
          <b-button variant="danger" @click.prevent="deleteCredential(data.item.credId)">
            Delete
          </b-button>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  name: 'CredentialPickerComponent',
  data: () => ({
    fields: [
      { key: 'credId', label: 'CredID' },
      { key: 'credentialName', label: 'Credential Name' },
      { key: 'actions', label: 'Actions' }
    ]
  }),
  computed: {
    ...mapState({
      credentials: state => state.credentials
    })
  },
  methods: {
    setLocalCredId (credId) {
      window.localStorage.setItem('credId', credId)
    },
    ...mapActions({
      deleteFirebaseCredential: 'deleteCredential'
    }),
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
