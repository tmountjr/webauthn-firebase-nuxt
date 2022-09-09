<template>
  <div class="credentialPicker">
    <b-table>
      <b-thead head-varient="dark">
        <b-tr>
          <b-th>CredID</b-th>
          <b-th>Description</b-th>
          <b-th>Action</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr v-for="cred in credentials" :key="cred.credId">
          <b-td>{{ cred.credId.slice(0, 8) }}...</b-td>
          <b-td>{{ cred.credentialName }}</b-td>
          <b-td>
            <b-button @click.prevent="setLocalCredId(cred.credId)">
              Use
            </b-button>
          </b-td>
        </b-tr>
      </b-tbody>
    </b-table>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'CredentialPickerComponent',
  computed: {
    ...mapState({
      authUser: state => state.authUser,
      credentials: state => state.credentials
    })
  },
  methods: {
    setLocalCredId (id) {
      window.localStorage.setItem('credId', id)
    }
  }
}
</script>
