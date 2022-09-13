<template>
  <h1>hello world</h1>
</template>

<script>
export default {
  name: 'IndexPage',
  async asyncData ({ $content, $axios }) {
    const schwarberContentUrl = $content('/schwarber').url
    const schwarberContent = await $axios.get(schwarberContentUrl)
    return {
      schwarber: schwarberContent.data.body
    }
  }
}
</script>
