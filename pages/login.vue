<template>
  <b-card title="Please sign in">
    <MiniAlert v-if="errorState" :error-level="errorLevel" @mini-alert-dismissed="alertDismissed">
      {{ errorText }}
    </MiniAlert>
    <b-form-group>
      <b-form-input
        id="email"
        v-model="email"
        placeholder="Enter email address"
        type="email"
        @blur="checkEmail"
      />
      <b-form-input id="pasword" v-model="password" placeholder="Enter password" type="password" />
    </b-form-group>
    <b-form-group>
      <b-button @click="userLogin">
        {{ submitButton }}
      </b-button>
    </b-form-group>

    <WebAuthnConditionalComponent v-if="emailExists">
      <template #unsupported>
        <span>&nbsp;</span>
      </template>

      <b-form-group>
        <div class="divider mb-3">
          <span class="divider-text">or</span>
        </div>

        <b-button variant="outline-secondary" @click="passkeyLogin">
          Sign in with Passkey
        </b-button>
      </b-form-group>
    </WebAuthnConditionalComponent>
  </b-card>
</template>

<script>
import { mapState } from 'vuex'
import base64url from 'base64url'
import { getAuth, getIdToken } from 'firebase/auth'

/** Store the Firebase UID but not in a way that is visible to the front-end */
let fbUid = ''

export default {
  name: 'NewLoginPage',
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

        const auth = getAuth(this.$fire.auth.app)
        const idToken = await getIdToken(auth.currentUser)
        this.$cookies.set('fbId', idToken, {
          maxAge: 60 * 60 * 12,
          sameSite: 'lax',
          secure: true
        })
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

      // Redirect the user to '/' unless the redirectTo query parameter is set.
      const dest = 'redirectTo' in this.$route.query
        ? this.$route.query.redirectTo
        : '/'

      this.$router.push(dest)
    },
    async checkEmail () {
      const ref = this.$fire.database.ref(`map/${this.emailMapKey}`)
      try {
        const snapshot = await ref.once('value')
        fbUid = snapshot.val()
        if (fbUid && typeof fbUid === 'string') {
          this.emailExists = true
        } else {
          fbUid = ''
        }
      } catch (e) {
        this.errorLevel = 'warning'
        this.errorState = true
        this.errorText = 'Unable to verify email status.'
      }
    },

    async passkeyLogin () {
      const { startAuthentication } = await import('@simplewebauthn/browser')

      let optsResponse
      try {
        optsResponse = await this.$axios('/auth/generate-authentication-options', {
          method: 'POST',
          data: {
            fbUid: fbUid || this.authUser.uid
          },
          headers: {
            'content-type': 'application/json'
          }
        })
      } catch (e) {
        this.errorState = true
        this.errorText = 'Unable to process webauthn.'
        return
      }

      const opts = optsResponse.data
      const currentChallenge = opts.challenge

      let authCredResponse
      try {
        authCredResponse = await startAuthentication(opts)
      } catch (e) {
        this.errorState = true
        this.errorText = 'Unable to start authentication.'
        return
      }

      try {
        const verificationResp = await this.$axios('/auth/verify-authentication', {
          method: 'POST',
          data: {
            currentChallenge,
            body: authCredResponse,
            fbUid: fbUid || this.authUser.uid,
            withToken: true
          },
          headers: {
            'content-type': 'application/json'
          }
        })

        const { verified, loginToken } = verificationResp.data
        if (verified) {
          try {
            await this.$fire.auth.signInWithCustomToken(loginToken)

            const dest = 'redirectTo' in this.$route.query
              ? this.$route.query.redirectTo
              : '/'

            this.$router.push(dest)
          } catch (e) {
            this.errorState = true
            this.errorText = 'Unable to log in with custom token.'
          }
        } else {
          this.errorState = true
          this.errorText = 'Unable to verify passkey.'
        }
      } catch (e) {
        this.errorState = true
        this.errorText = `Unknown error: ${e.message}`
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
.divider {
  border-bottom: 1.5px solid black;
  line-height: 0.1em;
}
.divider-text {
  background-color: white;
  padding: 0 25px;
}
</style>

<style scoped>
button {
  width: 100%;
}
</style>
