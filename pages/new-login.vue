<template>
  <b-card title="Please sign in">
    <MiniAlert v-if="errorState" :error-level="errorLevel" @mini-alert-dismissed="alertDismissed">
      {{ errorText }}
    </MiniAlert>
    <b-form-group>
      <b-form-input id="email" v-model="email" placeholder="Enter email address" type="email" @blur="checkEmail" />
      <b-form-input id="pasword" v-model="password" placeholder="Enter password" type="password" />
    </b-form-group>
    <b-form-group>
      <b-button @click="userLogin">
        {{ submitButton }}
      </b-button>
    </b-form-group>
  </b-card>
</template>

<script>
import { mapState } from 'vuex'
import base64url from 'base64url'
import MiniAlert from '@/components/MiniAlert.vue'

export default {
  name: 'NewLoginPage',
  components: {
    MiniAlert
  },
  layout: 'login',
  data: () => ({
    email: '',
    password: '',
    emailExists: false,
    uvpaAvailable: false,
    errorState: false,
    errorText: '',
    errorLevel: 'danger'
  }),
  computed: {
    ...mapState({
      authUser: state => state.authUser
    }),
    submitButton () {
      return this.emailExists ? 'Sign In' : 'Create Account'
    },
    emailMapKey () {
      return base64url.encode(this.email).replace(/=+$/g, '')
    }
  },
  beforeMount () {
    if (this.authUser) {
      this.email = this.authUser.email
      this.emailExists = true
    }
  },
  methods: {
    async refreshUvpa () {
      if (window?.PublicKeyCredential) {
        const uvpa = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        this.uvpaAvailable = uvpa
      }
    },
    async userLogin () {
      let user
      if (this.emailExists) {
        try {
          user = await this.$fire.auth.signInWithEmailAndPassword(this.email, this.password)
        } catch (e) {
          this.errorState = true
          this.errorText = 'Unable to log in with username and password.'
        }
      } else {
        try {
          user = await this.$fire.auth.createUserWithEmailAndPassword(this.email, this.password)
          const firebaseUid = user.user.uid
          const dbMapRef = this.$fire.database.ref(`map/${this.emailMapKey}`)
          await dbMapRef.set(firebaseUid)

          const dbMetaRef = this.$fire.database.ref(`users/${firebaseUid}`)
          await dbMetaRef.set({ email: this.email })
        } catch (e) {
          this.errorState = true
          this.errorText = 'Unable to create account.'
        }
      }
      await this.refreshUvpa()
    },
    async checkEmail () {
      const ref = this.$fire.database.ref(`map/${this.emailMapKey}`)
      try {
        const snapshot = await ref.once('value')
        const fbUid = snapshot.val()
        if (fbUid) {
          this.emailExists = true
        }
      } catch (e) {
        this.errorLevel = 'warning'
        this.errorState = true
        this.errorText = 'Unable to verify email status.'
      }
    },
    alertDismissed () {
      this.errorState = false
      this.errorText = ''
      this.errorLevel = 'danger'
    }
  }
}
</script>

<style scoped>
button {
  width: 100%;
}
</style>
