<template>
  <div class="reauth">
    <div v-if="webAuthnSupportWait">
      <h2>Checking if your browser supports WebAuthn...</h2>
    </div>

    <div v-else>
      <div v-if="webAuthnSupported">
        <b-row class="col-12">
          <CredentialPicker />
        </b-row>
        <b-row class="col-6">
          <AddCredential />
        </b-row>
      </div>
      <div v-else>
        <h2>Your browser does not support WebAuthn.</h2>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReauthPage',
  data: () => ({
    webAuthnSupported: false,
    webAuthnSupportWait: true
  }),
  mounted () {
    import('@simplewebauthn/browser')
      .then((imports) => {
        const { browserSupportsWebAuthn } = imports
        this.webAuthnSupported = browserSupportsWebAuthn()
        this.webAuthnSupportWait = false
      })
  }
}
</script>
