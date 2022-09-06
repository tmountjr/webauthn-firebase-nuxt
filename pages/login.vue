<!-- eslint-disable no-console -->
<template>
  <b-container class="login">
    <b-form @submit.prevent="userLogin">
      <b-form-group id="username-group" label="Enter your username:" label-for="username">
        <b-form-input id="username" v-model="username" type="text" placeholder="Username" required />
      </b-form-group>
      <b-form-group v-if="currentStage === 'username'" id="username-continue-group">
        <b-button @click.prevent="continueLogin">
          Continue
        </b-button>
      </b-form-group>

      <div v-if="currentStage === 'password'">
        <b-form-group
          id="password-group"
          label="Enter your password:"
          label-for="password"
        >
          <b-form-input id="password" v-model="password" type="password" placeholder="Password" required />
        </b-form-group>
        <b-button type="submit">
          Log In
        </b-button>
      </div>
    </b-form>
  </b-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

const base64Encode = str => Buffer.from(str).toString('base64')
// const base64Decode = str => Buffer.from(str, 'base64').toString('utf-8')

export default {
  name: 'LoginPage',
  data () {
    return {
      username: '',
      password: '',
      currentStage: 'username',
      firebaseUID: '',
      usernameExists: false
    }
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    ...mapGetters({
      isLoggedIn: 'isLoggedIn'
    })
  },
  methods: {
    async userLogin () {
      if (this.usernameExists) {
        try {
          const user = await this.$fire.auth.signInWithEmailAndPassword(this.username, this.password)
          console.log('logged in ', user)
        } catch (e) {
          console.error('error while signing in', e)
        }
      } else {
        try {
          const user = await this.$fire.auth.createUserWithEmailAndPassword(this.username, this.password)
          console.log('created ', user)
          // Once this is done
        } catch (e) {
          console.error('error while creating new account', e)
        }
      }
    },
    async continueLogin () {
      const usernameKey = base64Encode(this.username).replace(/=+$/g, '')
      const ref = this.$fire.database.ref(`map/${usernameKey}`)
      try {
        const snapshot = await ref.once('value')
        this.firebaseUID = snapshot.val()
        if (this.firebaseUID) {
          this.usernameExists = true
          this.currentStage = 'password'
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>
