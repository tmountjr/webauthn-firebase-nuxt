<template>
  <div class="webauthn-conditional">
    <span v-if="webAuthnSupportWait">
      <slot name="wait">
        <b-spinner variant="secondary" />
      </slot>
    </span>
    <span v-else>
      <slot v-if="!webAuthnSupported" name="unsupported">
        <p>Your browser does not support WebAuthn</p>
      </slot>
      <slot v-if="webAuthnSupported" />
    </span>
  </div>
</template>

<script>
export default {
  name: 'WebAuthnConditionalComponent',
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
