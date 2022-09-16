<template>
  <div class="profile">
    <div class="row">
      <h1>Public Profile</h1>
    </div>
    <div class="row">
      <b-form @submit.prevent="updateUser">
        <b-form-group
          id="profile-name-fieldset"
          label="Enter your name"
          label-for="profile-name"
        >
          <b-form-input id="profile-name" v-model="profile.name" trim />
        </b-form-group>
        <b-form-group
          id="profile-color-fieldset"
          label="Enter your favorite color"
          label-for="profile-color"
        >
          <b-form-input id="profile-color" v-model="profile.favoriteColor" type="color" />
        </b-form-group>

        <b-button type="submit">
          Save Profile Information
        </b-button>
      </b-form>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ProfilePage',
  data: () => ({
    profile: {
      name: '',
      favoriteColor: ''
    }
  }),
  async beforeMount () {
    const ref = this.$fire.database.ref(`users/${this.authUser.uid}/profile`)
    const snapshot = await ref.once('value')
    const profileData = snapshot?.val()
    if (profileData) {
      this.profile.name = profileData.name
      this.profile.favoriteColor = profileData.favoriteColor
    }
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser
    })
  },
  methods: {
    async updateUser () {
      const ref = this.$fire.database.ref(`users/${this.authUser.uid}/profile`)
      await ref.set(this.profile)
    }
  }
}
</script>
