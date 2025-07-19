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
      <el-form-item label="设备与位置">
        <el-popover placement="right" trigger="manual" :visible="locationVisible">
          <template #reference>
            <el-select
              ref="machineSelectRef"
              v-model="formData.machineId"
              placeholder="请选择设备"
              filterable
              remote
              :remote-method="searchMachine"
              :loading="machineLoading"
              automatic-dropdown
              class="!w-240px"
              @visible-change="onMachineVisibleChange"
              @change="onMachineSelect"
            >
              <el-option
                v-for="item in machineList"
                :key="item.id"
                :label="item.deviceName"
                :value="item.id"
              />
            </el-select>
          </template>
          <el-select
            ref="locationSelectRef"
            v-model="formData.machineLocationId"
            placeholder="请选择位置"
            :loading="locationLoading"
            automatic-dropdown
            class="!w-200px"
            @change="onLocationSelect"
          >
            <el-option
              v-for="loc in locationList"
              :key="loc.id"
              :label="loc.locationInfo"
              :value="loc.id"
            />
          </el-select>
        </el-popover>
        <span v-if="selectedMachineName && selectedLocationName" class="ml-10px">
          {{ selectedMachineName }} / {{ selectedLocationName }}
        </span>
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
import { onMounted, ref, reactive, watch, computed, nextTick } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { SensorInfoApi, SensorInfoVO } from '@/api/aiot/sensorInfo'
import { MachineInfoApi, MachineInfoVO } from '@/api/aiot/machineInfo'
import type { MachineLocationInfoVO } from '@/api/aiot/machineLocationInfo'
import type { ElSelect } from 'element-plus'
import { formatDate } from '@/utils/formatTime'
import type { EChartsOption } from 'echarts'
import Echart from '@/components/Echart/src/Echart.vue'
import { useWebSocketClient } from './websocket'

/** 实时检测 */
defineOptions({ name: 'RealTimeMonitor' })

const message = useMessage()

// --- form and state ---
const sensorList = ref<SensorInfoVO[]>([])
const formData = reactive({
  sensorId: undefined as number | undefined,
  gatewayMac: '',
  machineId: undefined as number | undefined,
  machineLocationId: undefined as number | undefined
})
const showConfirm = ref(false)

// 设备与位置
const machineSelectRef = ref<InstanceType<typeof ElSelect>>()
const locationSelectRef = ref<InstanceType<typeof ElSelect>>()
const machineList = ref<MachineInfoVO[]>([])
const machinePage = reactive({ pageNo: 1, pageSize: 10, deviceName: '' })
const machineTotal = ref(0)
const machineLoading = ref(false)
const locationList = ref<MachineLocationInfoVO[]>([])
const locationLoading = ref(false)
const locationVisible = ref(false)
const selectedMachineName = ref('')
const selectedLocationName = ref('')

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

// 加载设备列表
const loadMachineList = async (append = false) => {
  machineLoading.value = true
  try {
    const res = await MachineInfoApi.getMachineInfoPage(machinePage)
    machineTotal.value = res.total
    machineList.value = append ? machineList.value.concat(res.list) : res.list
  } finally {
    machineLoading.value = false
  }
}

const searchMachine = (q: string) => {
  machinePage.deviceName = q
  machinePage.pageNo = 1
  loadMachineList(false)
}

const handleMachineScroll = async () => {
  const wrap = machineSelectRef.value?.scrollbar?.wrapRef
  if (!wrap) return
  if (
    wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight <= 0 &&
    machineList.value.length < machineTotal.value &&
    !machineLoading.value
  ) {
    machinePage.pageNo += 1
    await loadMachineList(true)
  }
}

const onMachineVisibleChange = async (v: boolean) => {
  if (v) {
    machinePage.pageNo = 1
    await loadMachineList(false)
    await nextTick()
    const wrap = machineSelectRef.value?.scrollbar?.wrapRef
    wrap?.addEventListener('scroll', handleMachineScroll)
  }
}

const loadLocationList = async (id: number) => {
  locationLoading.value = true
  try {
    const res = await MachineInfoApi.getMachineLocationInfoPage({
      pageNo: 1,
      pageSize: 100,
      machineId: id
    })
    locationList.value = res.list || []
  } finally {
    locationLoading.value = false
  }
}

const onMachineSelect = async (id: number) => {
  const m = machineList.value.find((i) => i.id === id)
  selectedMachineName.value = m?.deviceName || ''
  formData.machineLocationId = undefined
  selectedLocationName.value = ''
  await loadLocationList(id)
  locationVisible.value = true
  await nextTick()
  locationSelectRef.value?.focus()
}

const onLocationSelect = (id: number) => {
  const loc = locationList.value.find((l) => l.id === id)
  selectedLocationName.value = loc?.locationInfo || ''
  locationVisible.value = false
}

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
  await loadMachineList(false)
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
    ws.send({
      type: 'aiot-save-data',
      content: { machineLocationId: formData.machineLocationId }
    })
  }
}

// 图表数据 & 类型切换
watch([graphType, dataList], updateChart)
</script>
