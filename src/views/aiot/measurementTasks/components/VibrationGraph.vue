<template>
  <div>
    <el-radio-group v-model="graphType" class="mb-10px">
      <el-radio-button label="RMS">RMS</el-radio-button>
      <el-radio-button label="RMSMA">RMSMA</el-radio-button>
      <el-radio-button label="PeakToPeak">PeakToPeak</el-radio-button>
    </el-radio-group>
    <Echart :height="350" :options="chartOptions" v-loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { EChartsOption } from 'echarts'
import { watch, reactive, ref } from 'vue'
import { formatDate } from '@/utils/formatTime'
import { MeasurementTasksApi } from '@/api/aiot/measurementTasks'

/** 振动图表 */
defineOptions({ name: 'VibrationGraph' })

const props = defineProps<{ taskId?: number }>()

const graphType = ref<'RMS' | 'RMSMA' | 'PeakToPeak'>('RMS')
const loading = ref(false)
const chartOptions = reactive<EChartsOption>({
  grid: { left: 50, right: 20, bottom: 20, top: 60, containLabel: true },
  legend: { data: ['X轴', 'Y轴', 'Z轴'], top: 20 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    padding: [5, 10]
  },
  xAxis: { type: 'category', data: [], boundaryGap: false, axisTick: { show: false } },
  yAxis: { axisTick: { show: false } },
  series: [
    { name: 'X轴', type: 'line', smooth: true, data: [] },
    { name: 'Y轴', type: 'line', smooth: true, data: [] },
    { name: 'Z轴', type: 'line', smooth: true, data: [] }
  ]
})

const loadData = async () => {
  if (!props.taskId) {
    chartOptions.xAxis!['data'] = []
    chartOptions.series?.forEach((s) => (s.data = []))
    return
  }
  loading.value = true
  try {
    const data = await MeasurementTasksApi.getVibrationRecordsPage({
      pageNo: 1,
      pageSize: 1000,
      taskId: props.taskId
    })
    const list = data.list || []
    chartOptions.xAxis!['data'] = list.map((item: any) => formatDate(item.timestamp, 'MM-DD HH:mm'))
    const map = {
      RMS: ['xAxisRms', 'yAxisRms', 'zAxisRms'],
      RMSMA: ['xAxisMaRms', 'yAxisMaRms', 'zAxisMaRms'],
      PeakToPeak: ['xAxisPeakToPeak', 'yAxisPeakToPeak', 'zAxisPeakToPeak']
    }
    const keys = map[graphType.value]
    chartOptions.series?.forEach((s, index) => {
      // @ts-ignore
      s.data = list.map((item: any) => item[keys[index]])
    })
  } finally {
    loading.value = false
  }
}

watch([() => props.taskId, graphType], loadData, { immediate: true })
</script>
