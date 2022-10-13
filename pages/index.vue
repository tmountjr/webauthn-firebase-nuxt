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
  async asyncData ({ $axios }) {
    const resp = await $axios('/schwarber')
    const schwarberContent = resp.data
    const labels = schwarberContent.data.map(line => line.Year)

    // Inject a value for singles ("1B") = H - (2B + 3B + HR)
    schwarberContent.data.forEach((year) => {
      year['1B'] = parseInt(year.H) - (parseInt(year['2B']) + parseInt(year['3B']) + parseInt(year.HR))
    })

    const statKeys = ['BB', '1B', '2B', '3B', 'HR']
    const statColors = [
      'rgb(212, 116, 106)',
      'rgb(80, 161, 98)',
      'rgb(67, 121, 131)',
      'rgb(212, 158, 106)',
      'rgb(230, 207, 130)'
    ]
    const datasets = statKeys.map((key, index) => ({
      label: key,
      data: schwarberContent.data.map(line => line[key]),
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
