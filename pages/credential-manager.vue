<template>
  <WebAuthnConditionalComponent class="reauth">
    <template #wait>
      <h2>Checking if your browser supports WebAuthn...</h2>
    </template>

    <template #unsupported>
      <h2>Your browser does not support WebAuthn.</h2>
    </template>

    <b-row class="col-12">
      <CredentialPicker />
    </b-row>
    <b-row class="col-6">
      <AddCredential />
    </b-row>
  </WebAuthnConditionalComponent>
</template>

<script>
export default {
  name: 'ReauthPage'
}
</script>
