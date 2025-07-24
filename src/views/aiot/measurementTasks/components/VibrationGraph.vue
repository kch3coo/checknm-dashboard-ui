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

const loadSingleTaskData = async (id: number, keys: string[]) => {
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
  chartOptions.legend!.data = ['X轴', 'Y轴', 'Z轴']
  chartOptions.series = ['X轴', 'Y轴', 'Z轴'].map((axis, idx) => ({
    name: axis,
    type: 'line',
    smooth: true,
    showSymbol: false,
    data: list.map((item: any) => item[keys[idx]])
  }))
}

/**
 * 多任务对比：单独归一化每个子列表，再为每个任务的 XYZ 轴生成 series
 * @param ids  要对比的任务 ID 列表
 * @param keys 对应于 ['X','Y','Z'] 三条轴的数据字段名数组
 */
const loadComparisonData = async (ids: number[], keys: [string, string, string]) => {
  // 1. 设置 x 轴为数值轴，名称 “秒”
  chartOptions.xAxis = { type: 'value', name: '秒' }
  chartOptions.series = []
  chartOptions.legend!.data = []

  // 2. 并发拉取每个任务的记录列表
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

  // 3. 归一化：生成与 lists 一一对应的 normalizedTimeLists
  const normalizedTimeLists = lists.map((list) => {
    if (list.length === 0) return [] as number[]
    const base = list[0].timestamp
    // 转成秒数并减初始
    return list.map((item: any) => (item.timestamp - base) / 1000)
  })

  // 4. 为每个任务 & 每条轴，生成一条 line series
  const axes = ['X轴', 'Y轴', 'Z轴']
  lists.forEach((list, i) => {
    const times = normalizedTimeLists[i]
    const taskId = ids[i]
    axes.forEach((axis, ai) => {
      chartOptions.legend!.data.push(`${taskId}-${axis}`)
      chartOptions.series!.push({
        name: `${taskId}-${axis}`,
        type: 'line',
        smooth: true,
        showSymbol: false,
        // ECharts value 轴下可以直接用 [x, y] 对
        data: list.map((item: any, idx: number) => [
          times[idx],
          // 根据 axisIdx 取对应字段
          item[keys[ai]]
        ])
      })
    })
  })
}

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

    const keys = map[graphType.value]
    if (ids.length === 1) {
      await loadSingleTaskData(ids[0], keys)
    } else {
      await loadComparisonData(ids, keys)
    }
  } finally {
    loading.value = false
  }
}

watch([() => props.taskIds, graphType], loadData, { immediate: true })
</script>
