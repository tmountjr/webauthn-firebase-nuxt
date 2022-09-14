<template>
  <div class="chart">
    <canvas id="chart-component" ref="chart-component" :title="label" />
  </div>
</template>

<script>
import Chart from 'chart.js/auto'

export default {
  name: 'LineChartComponent',
  props: {
    labels: {
      type: Array,
      default: () => ([])
    },
    datasets: {
      type: Array,
      default: () => ([])
    },
    title: {
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
      responsive: true,
      maintainAspectRatio: false
    }
    if (this.title) {
      options.plugins = {
        title: {
          display: true,
          text: this.title
        }
      }
    }
    this.chartRef = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: this.datasets
      },
      options
    })
  }
}
</script>

<style lang="scss" scoped>
$canvasY: 300px;
$canvasX: 1000px;
.chart {
  position: relative;
  margin: 0 1rem;
  height: $canvasY;
  width: $canvasX;

  @media (max-width: 768px) {
    height: calc($canvasY / 2);
    width: calc($canvasX / 4);
  }
}
</style>
