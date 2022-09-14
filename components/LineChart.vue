<template>
  <div class="chart">
    <canvas id="chart-component" ref="chart-component" :width="width" :height="height" :label="label" />
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
    datasets: {
      type: Array,
      default: () => ([])
    },
    label: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    chartRef: {}
  }),
  mounted () {
    const ctx = document.getElementById('chart-component').getContext('2d')
    const options = {
      responsive: true
    }
    if (this.label) {
      options.plugins = {
        title: {
          display: true,
          text: this.label
        }
      }
    }
    this.chartRef = new Chart(ctx, {
      type: 'line',
      label: this.label,
      data: {
        labels: this.labels,
        datasets: this.datasets
      },
      options
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
