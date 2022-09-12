<template>
  <b-alert
    show
    class="mini-alert"
    dismissible
    :variant="errorLevel"
    @dismissed="alertDismissed"
  >
    <slot />
  </b-alert>
</template>

<script>
export default {
  name: 'MiniAlertComponent',
  props: {
    errorLevel: {
      type: String,
      default: 'danger'
    }
  },
  methods: {
    alertDismissed () {
      this.$emit('mini-alert-dismissed')
    }
  }
}
</script>
