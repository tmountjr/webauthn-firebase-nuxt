<template>
  <div class="chart">
    <canvas id="chart-component" ref="chart-component" :width="width" :height="height" />
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'LineChartComponent',
  props: {
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 400
    },
    labels: {
      type: Array,
      default: () => ([])
    },
    data: {
      type: Array,
      default: () => ([])
    }
  },
  data: () => ({
    chartRef: {}
  }),
  mounted () {
    const ctx = document.getElementById('chart-component').getContext('2d')
    // eslint-disable-next-line no-unused-vars
    this.chartRef = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [{
          data: this.data
        }]
      },
      options: {
        responsive: true
      }
    })
  }
}
</script>

<style scoped>
.chart {
  position: relative;
  margin: auto;
  height: 20vh;
  width: 40vw;
}
</style>
