<template>
  <ContentWrap>
    <el-form :model="formData" label-width="90px" inline>
      <el-form-item label="传感器UUID">
        <el-select
          v-model="formData.sensorId"
          placeholder="请选择传感器"
          class="!w-240px"
          @change="onSensorChange"
        >
          <el-option
            v-for="item in sensorList"
            :key="item.id"
            :label="item.uuid"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="网关MAC">
        <el-input
          v-model="formData.gatewayMac"
          placeholder="请输入网关MAC"
          class="!w-240px"
          @input="onGatewayMacInput"
        />
        <el-button v-if="showConfirm" class="ml-5px" type="primary" @click="confirmGatewayMac"
          >确认
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="toggleConnectStatus">
          <Icon icon="ep:link" class="mr-5px" />
          {{ getIsOpen ? '断开连接' : '连接' }}
        </el-button>
      </el-form-item>
      <template v-if="getIsOpen">
        <el-form-item label="检测方法">
          <el-radio-group v-model="detectionForm.recordMethod">
            <el-radio-button :label="0">Manual</el-radio-button>
            <el-radio-button :label="1">Before</el-radio-button>
            <el-radio-button :label="2">After</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检测方式">
          <el-radio-group
            v-model="detectionForm.recordType"
            :disabled="detectionForm.recordMethod !== 0"
          >
            <el-radio-button :label="0">手动</el-radio-button>
            <el-radio-button :label="1">定时</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="detectionForm.recordType === 1">
          <el-input-number v-model="detectionForm.timer" :min="1" />
        </el-form-item>
        <el-form-item>
          <el-button v-if="!isRecording" type="success" @click="startStream"> 开始检测 </el-button>
          <el-button v-else type="warning" @click="stopStream"> 停止检测 </el-button>
          <span class="ml-10px" v-if="isRecording">{{ timerCounter }}</span>
        </el-form-item>
      </template>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-radio-group v-model="graphType" class="mb-10px">
      <el-radio-button label="RMS">RMS</el-radio-button>
      <el-radio-button label="RMSMA">RMSMA</el-radio-button>
      <el-radio-button label="PeakToPeak">PeakToPeak</el-radio-button>
    </el-radio-group>
    <Echart :height="350" :options="chartOptions" />
  </ContentWrap>
  
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch, computed } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { SensorInfoApi, SensorInfoVO } from '@/api/aiot/sensorInfo'
import { formatDate } from '@/utils/formatTime'
import type { EChartsOption } from 'echarts'
import Echart from '@/components/Echart/src/Echart.vue'
import { useWebSocketClient } from './websocket'

/** 实时检测 */
defineOptions({ name: 'RealTimeMonitor' })

const message = useMessage()

const sensorList = ref<SensorInfoVO[]>([])
const formData = reactive({
  sensorId: undefined as number | undefined,
  gatewayMac: ''
})
const showConfirm = ref(false)

const detectionForm = reactive({
  recordMethod: 0, // Manual, Before, After
  recordType: 0, // 手动 or 定时
  timer: 5
})
const isRecording = ref(false)
const isStreaming = ref(false)
const timerCounter = ref(0)
let timerInterval: any

const dataList = ref<any[]>([])
const graphType = ref<'RMS' | 'RMSMA' | 'PeakToPeak'>('RMS')
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

let ws: ReturnType<typeof useWebSocketClient>
const socketStatus = ref('')
const getIsOpen = computed(() => socketStatus.value === 'OPEN')

onMounted(async () => {
  const res = await SensorInfoApi.getSensorInfoPage({ pageNo: 1, pageSize: 100 })
  sensorList.value = res.list || []
  if (sensorList.value.length > 0) {
    formData.sensorId = sensorList.value[0].id
    formData.gatewayMac = sensorList.value[0].gatewayMac
  }
})

const onSensorChange = (id: number) => {
  const sensor = sensorList.value.find((s) => s.id === id)
  if (sensor) {
    formData.gatewayMac = sensor.gatewayMac
    showConfirm.value = false
    if (getIsOpen.value) {
      ws.connectSensor(formData.sensorId)
    }
  }
}

const updateGatewayMac = async () => {
  if (!formData.sensorId) return
  await SensorInfoApi.updateSensorInfo({
    id: formData.sensorId,
    gatewayMac: formData.gatewayMac
  } as unknown as SensorInfoVO)
}

const onGatewayMacInput = () => {
  showConfirm.value = true
}

const confirmGatewayMac = async () => {
  await updateGatewayMac()
  showConfirm.value = false
}


const updateChart = () => {
  const list = dataList.value
  chartOptions.xAxis!['data'] = list.map((item: any) => formatDate(item.timestamp, 'HH:mm:ss'))
  const map = {
    RMS: ['xaxisRms', 'yaxisRms', 'zaxisRms'],
    RMSMA: ['xaxisMaRms', 'yaxisMaRms', 'zaxisMaRms'],
    PeakToPeak: ['xaxisPeakToPeak', 'yaxisPeakToPeak', 'zaxisPeakToPeak']
  }
  const keys = map[graphType.value]
  chartOptions.series?.forEach((s, index) => {
    // @ts-ignore
    s.data = list.map((item: any) => item[keys[index]])
  })
}


const handleStatus = (val: string) => {
  socketStatus.value = val
}

const handleMessage = (newVal: string) => {
  if (!newVal || newVal === 'pong') return
  try {
    const msg = JSON.parse(newVal)
    const type = msg.type
    if (!type) return
    if (type === 'aiot-connect-sensor-resp' && msg.content?.code === 1060300008) {
      message.error('节点连接失败')
      ws.close()
      isStreaming.value = false
      return
    }
    if (type === 'aiot-start-stream-data-resp' && isStreaming.value) {
      const content = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content
      dataList.value.push(content)
      if (dataList.value.length > 50) dataList.value.shift()
      updateChart()
    }
  } catch (e) {
    console.error(e)
  }
}

ws = useWebSocketClient({
  onMessage: handleMessage,
  onStatus: handleStatus
})

watch(socketStatus, (val) => {
  if (val === 'OPEN') {
    ws.connectSensor(formData.sensorId)
  } else {
    isRecording.value = false
    isStreaming.value = false
  }
})

watch([graphType, dataList], updateChart)

const toggleConnectStatus = () => {
  if (getIsOpen.value) {
    ws.close()
  } else {
    ws.open()
    ws.connectSensor(formData.sensorId)
  }
}

const startStream = () => {
  if (!getIsOpen.value) {
    message.error('请先连接传感器')
    return
  }
  const timer = detectionForm.recordType === 1 ? detectionForm.timer : 0
  ws.startStream({
    recordType: detectionForm.recordType,
    recordMethod: detectionForm.recordMethod,
    timer
  })
  isRecording.value = true
  isStreaming.value = true
  timerCounter.value = detectionForm.recordType === 1 ? detectionForm.timer : 0
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (detectionForm.recordType === 0) {
      timerCounter.value++
    } else {
      timerCounter.value--
    }
  }, 1000)
}

const stopStream = async () => {
  if (!getIsOpen.value || !isRecording.value) return
  clearInterval(timerInterval)
  isRecording.value = false
  isStreaming.value = false
  ws.stopStream()
  try {
    await message.confirm('是否保存数据？')
    ws.send({
      type: 'aiot-save-data',
      content: {}
    })
  } catch {}
}
</script>
