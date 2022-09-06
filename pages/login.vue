<template>
  <b-container class="login">
    <b-form>
      <div>
        <b-form-group id="email-group" label="Enter your email:" label-for="email">
          <b-form-input id="email" v-model="email" type="text" placeholder="Email Address" required />
        </b-form-group>
        <b-form-group v-if="currentStage === 'email'" id="email-continue-group">
          <b-button @click.prevent="checkEmail">
            Continue
          </b-button>
        </b-form-group>
      </div>

      <div v-if="currentStage === 'password'">
        <b-form-group id="password-group" label="Enter your password:" label-for="password">
          <b-form-input id="password" v-model="password" type="password" placeholder="Password" required />
        </b-form-group>
        <b-button @click.prevent="userLogin">
          {{ submitButton }}
        </b-button>
      </div>
    </b-form>
  </b-container>
</template>

<script>
// <!-- eslint-disable no-console -->
import { mapState, mapGetters } from 'vuex'

const base64Encode = str => Buffer.from(str).toString('base64')
// const base64Decode = str => Buffer.from(str, 'base64').toString('utf-8')

export default {
  name: 'LoginPage',
  data () {
    return {
      email: '',
      password: '',
      currentStage: 'email',
      firebaseUID: '',
      emailExists: false
    }
  },
  computed: {
    ...mapState({
      authUser: state => state.authUser,
      idToken: state => state.idToken
    }),
    ...mapGetters({
      isLoggedIn: 'isLoggedIn',
      idToken: 'idToken'
    }),
    submitButton () {
      return this.emailExists
        ? 'Log In'
        : 'Create Account'
    }
  },
  beforeMount () {
    const currentUser = this.$fire.auth._delegate.currentUser
    if (currentUser) {
      this.email = currentUser.email
      this.currentStage = 'password'
      this.firebaseUID = currentUser.uid
      this.emailExists = true
    }
  },
  methods: {
    async userLogin () {
      let user
      if (this.emailExists) {
        try {
          user = await this.$fire.auth.signInWithEmailAndPassword(this.email, this.password)
        } catch (e) {
          console.error('error while signing in', e)
        }
      } else {
        try {
          user = await this.$fire.auth.createUserWithEmailAndPassword(this.email, this.password)
          const firebaseUid = user.user.uid

          // Once this is done, create metadata on firebase
          const mapKey = base64Encode(this.email).replace(/=+$/g, '')

          const dbMapRef = this.$fire.database.ref(`map/${mapKey}`)
          await dbMapRef.set(firebaseUid)

          const dbMetaRef = this.$fire.database.ref(`users/${firebaseUid}`)
          await dbMetaRef.set({ email: this.email })
        } catch (e) {
          console.error('error while creating new account', e)
        }
      }
    },
    async checkEmail () {
      const mapKey = base64Encode(this.email).replace(/=+$/g, '')
      const ref = this.$fire.database.ref(`map/${mapKey}`)
      try {
        const snapshot = await ref.once('value')
        this.firebaseUID = snapshot.val()
        if (this.firebaseUID) {
          this.emailExists = true
        }
        this.currentStage = 'password'
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>
