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

const props = defineProps<{ taskIds?: number[] }>()

const graphType = ref<'RMS' | 'RMSMA' | 'PeakToPeak'>('RMS')
const loading = ref(false)
const chartOptions = reactive<EChartsOption>({
  grid: { left: 50, right: 20, bottom: 20, top: 60, containLabel: true },
  legend: { data: [], top: 20 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    padding: [5, 10]
  },
  xAxis: {
    type: 'category',
    data: [],
    boundaryGap: false,
    axisTick: { show: false },
    name: ''
  },
  yAxis: { axisTick: { show: false } },
  series: []
})

const loadData = async () => {
  loading.value = true
  try {
    chartOptions.series = []
    chartOptions.legend!.data = []
    const ids = props.taskIds?.filter((id) => id !== undefined) || []
    const map = {
      RMS: ['xAxisRms', 'yAxisRms', 'zAxisRms'],
      RMSMA: ['xAxisMaRms', 'yAxisMaRms', 'zAxisMaRms'],
      PeakToPeak: ['xAxisPeakToPeak', 'yAxisPeakToPeak', 'zAxisPeakToPeak']
    }

    if (ids.length === 0) {
      chartOptions.xAxis!['data'] = []
      chartOptions.xAxis!['name'] = ''
      return
    }

    if (ids.length === 1) {
      const id = ids[0]
      chartOptions.xAxis!['name'] = ''
      const data = await MeasurementTasksApi.getVibrationRecordsPage({
        pageNo: 1,
        pageSize: 1000,
        taskId: id
      })
      const list = data.list || []
      chartOptions.xAxis!['data'] = list.map((item: any) =>
        formatDate(item.timestamp, 'MM-DD HH:mm:ss')
      )
      const keys = map[graphType.value]
      chartOptions.legend!.data = ['X轴', 'Y轴', 'Z轴']
      chartOptions.series = ['X轴', 'Y轴', 'Z轴'].map((axis, idx) => ({
        name: axis,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: list.map((item: any) => item[keys[idx]])
      }))
    } else {
      chartOptions.xAxis!['name'] = '秒'
      const responses = await Promise.all(
        ids.map((id) =>
          MeasurementTasksApi.getVibrationRecordsPage({
            pageNo: 1,
            pageSize: 1000,
            taskId: id
          })
        )
      )
      const lists = responses.map((r) => r.list || [])
      const start = Math.min(
        ...lists.map((list) => (list[0] ? list[0].timestamp : Infinity))
      )
      const timeSet = new Set<number>()
      lists.forEach((list) => {
        list.forEach((item: any) => {
          const sec = (item.timestamp - start) / 1000
          timeSet.add(sec)
        })
      })
      const times = Array.from(timeSet).sort((a, b) => a - b)
      chartOptions.xAxis!['data'] = times.map((t) => t.toString())

      const axes = ['X轴', 'Y轴', 'Z轴']
      const keys = map[graphType.value]
      lists.forEach((list, idxTask) => {
        const id = ids[idxTask]
        const recordMap = new Map<number, any>()
        list.forEach((item: any) => {
          const sec = (item.timestamp - start) / 1000
          recordMap.set(sec, item)
        })
        axes.forEach((axis, axisIdx) => {
          chartOptions.legend!.data.push(`${id}-${axis}`)
          chartOptions.series!.push({
            name: `${id}-${axis}`,
            type: 'line',
            smooth: true,
            showSymbol: false,
            data: times.map((sec) => {
              const rec = recordMap.get(sec)
              return rec ? rec[keys[axisIdx]] : null
            })
          })
        })
      })
    }
  } finally {
    loading.value = false
  }
}

watch([() => props.taskIds, graphType], loadData, { immediate: true })
</script>
