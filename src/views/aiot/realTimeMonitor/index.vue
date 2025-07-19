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
        <el-button v-if="showConfirm" class="ml-5px" type="primary" @click="confirmGatewayMac">
          确认
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="toggleConnectStatus">
          <Icon icon="ep:link" class="mr-5px" />
          {{ getIsOpen ? '断开连接' : '连接' }}
        </el-button>
      </el-form-item>

      <template v-if="getIsOpen">
        <!-- 检测配置省略，与原来一致 -->
        <el-form-item>
          <el-button v-if="!isRecording" type="success" @click="startStream"> 开始检测 </el-button>
          <el-button v-else type="warning" @click="stopStream"> 停止检测 </el-button>
          <span class="ml-10px" v-if="isRecording">{{ timerCounter }}</span>
        </el-form-item>
        <el-form-item label="测量类型">
          <el-select v-model="detectionForm.recordType" class="!w-120px" placeholder="选择类型">
            <el-option label="Manual" :value="0" />
            <el-option label="Before" :value="1" />
            <el-option label="After" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="测量方法">
          <el-select
            v-model="detectionForm.recordMethod"
            class="!w-120px"
            placeholder="选择方法"
            :disabled="detectionForm.recordType !== 0"
          >
            <el-option label="手动" :value="0" />
            <el-option label="定时" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="detectionForm.recordMethod === 1" label="定时时间">
          <el-input-number v-model="detectionForm.timer" :min="1" class="!w-120px" />
          <span class="ml-5px">秒</span>
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

// --- form and state ---
const sensorList = ref<SensorInfoVO[]>([])
const formData = reactive({ sensorId: undefined as number | undefined, gatewayMac: '' })
const showConfirm = ref(false)

const detectionForm = reactive({ recordMethod: 0, recordType: 0, timer: 5 })
const isRecording = ref(false)
const timerCounter = ref(0)
let timerInterval: any

const isTimerMethod = computed(() => detectionForm.recordMethod === 1)

watch(
  () => detectionForm.recordType,
  (val) => {
    if (val !== 0) detectionForm.recordMethod = 1
  }
)

const dataList = ref<any[]>([])
const graphType = ref<'RMS' | 'RMSMA' | 'PeakToPeak'>('RMS')
const chartOptions = reactive<EChartsOption>({
  grid: { left: 50, right: 20, bottom: 20, top: 60, containLabel: true },
  legend: { data: ['X轴', 'Y轴', 'Z轴'], top: 20 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  xAxis: { type: 'category', data: [], boundaryGap: false },
  yAxis: {},
  series: [
    { name: 'X轴', type: 'line', smooth: true, data: [] },
    { name: 'Y轴', type: 'line', smooth: true, data: [] },
    { name: 'Z轴', type: 'line', smooth: true, data: [] }
  ]
})

const socketStatus = ref('')
const getIsOpen = computed(() => socketStatus.value === 'OPEN')

// --- handlers ---
const handleStatus = (s: string) => {
  socketStatus.value = s
}
const handleMessage = (raw: string) => {
  console.log('index 收到信息', JSON.parse(raw))
  try {
    const msg = JSON.parse(raw)
    const { type, content } = msg
    // 连接失败
    if (type === 'aiot-connect-sensor-resp' && content?.code === 1060300008) {
      message.error('节点连接失败')
      toggleConnectStatus()
      return
    }
    // 收到测量数据
    if (
      (type === 'aiot-connect-sensor-resp' || type === 'aiot-start-stream-data-resp') &&
      content.code === 1060000000
    ) {
      const data = typeof content === 'string' ? JSON.parse(content) : content
      dataList.value.push(data)
      if (dataList.value.length > 50) dataList.value.shift()
      updateChart()
    }
  } catch (e) {
    console.error(e)
  }
}

const updateChart = () => {
  const map = {
    RMS: ['xaxisRms', 'yaxisRms', 'zaxisRms'],
    RMSMA: ['xaxisMaRms', 'yaxisMaRms', 'zaxisMaRms'],
    PeakToPeak: ['xaxisPeakToPeak', 'yaxisPeakToPeak', 'zaxisPeakToPeak']
  }
  chartOptions.xAxis!['data'] = dataList.value.map((i) => formatDate(i.timestamp, 'HH:mm:ss'))
  chartOptions.series!.forEach((s, idx) => {
    // @ts-ignore
    s.data = dataList.value.map((i) => i[map[graphType.value][idx]])
  })
}

// --- WebSocket 客户端实例 ---
let ws = useWebSocketClient({
  onMessage: handleMessage,
  onStatus: handleStatus,
  onOpen: () => {
    console.log(`WebSocket(${formData.sensorId}) OPEN`)
    ws.connectSensor(formData.sensorId)
  },
  onClose: () => {
    console.log('WebSocket CLOSED')
    // 断开后可做清理：停止打点/定时器等
    clearInterval(timerInterval)
    isRecording.value = false
  }
})

// --- 业务逻辑 ---
onMounted(async () => {
  const res = await SensorInfoApi.getSensorInfoPage({ pageNo: 1, pageSize: 100 })
  sensorList.value = res.list || []
  if (sensorList.value.length) {
    formData.sensorId = sensorList.value[0].id
    formData.gatewayMac = sensorList.value[0].gatewayMac
  }
})

const onSensorChange = (id: number) => {
  const s = sensorList.value.find((x) => x.id === id)
  if (s) {
    formData.gatewayMac = s.gatewayMac
    showConfirm.value = false
    if (getIsOpen.value) ws.connectSensor(formData.sensorId)
  }
}

const onGatewayMacInput = () => {
  showConfirm.value = true
}
const confirmGatewayMac = async () => {
  if (!formData.sensorId) return
  await SensorInfoApi.updateSensorInfo({
    id: formData.sensorId,
    gatewayMac: formData.gatewayMac
  } as any)
  showConfirm.value = false
}

const toggleConnectStatus = () => {
  if (getIsOpen.value) ws.close()
  else ws.open()
}

const startStream = () => {
  if (!getIsOpen.value) {
    message.error('请先连接传感器')
    return
  }
  ws.startStream({
    recordType: detectionForm.recordType,
    recordMethod: detectionForm.recordMethod,
    timer: isTimerMethod.value ? detectionForm.timer : 0
  })
  isRecording.value = true
  timerCounter.value = isTimerMethod.value ? detectionForm.timer : 0
  clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (isTimerMethod.value) {
      timerCounter.value--
      if (timerCounter.value <= 0) stopStream()
    } else {
      timerCounter.value++
    }
  }, 1000)
}

const stopStream = async () => {
  if (!getIsOpen.value || !isRecording.value) return
  ws.stopStream()
  clearInterval(timerInterval)
  isRecording.value = false
  if (await message.confirm('是否保存数据？')) {
    ws.send({ type: 'aiot-save-data', content: {} })
  }
}

// 图表数据 & 类型切换
watch([graphType, dataList], updateChart)
</script>
