<template>
  <div>
    <client-only>
      <LineChart :labels="labels" :data="data" :width="100" :height="100" />
    </client-only>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  async asyncData ({ $content }) {
    const schwarberContent = await $content('/schwarber').fetch()
    const labels = schwarberContent.body.map(line => line.Year)
    const data = schwarberContent.body.map(line => line.HR)
    return {
      labels,
      data
    }
  },
  data: () => ({
  })
}
</script>
