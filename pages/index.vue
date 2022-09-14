<template>
  <div class="flex-grow-1">
    <client-only>
      <LineChart :labels="labels" :datasets="datasets" title="Kyle Schwarber Extra Base Hits (Career)" />
    </client-only>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  async asyncData ({ $content }) {
    const schwarberContent = await $content('/schwarber').fetch()
    const labels = schwarberContent.body.map(line => line.Year)

    const statKeys = ['2B', '3B', 'HR']
    const statColors = ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(75, 192, 192)']
    const datasets = statKeys.map((key, index) => ({
      label: key,
      data: schwarberContent.body.map(line => line[key]),
      borderColor: statColors[index]
    }))

    return {
      labels,
      datasets
    }
  },
  data: () => ({
  })
}
</script>
