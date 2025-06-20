<template>
  <Dialog v-model="dialogVisible" title="振动记录导入" width="400">
    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :auto-upload="false"
      :limit="1"
      :disabled="formLoading"
      accept=".csv"
      drag
    >
      <Icon icon="ep:upload" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
    </el-upload>
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确定</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { MeasurementTasksApi } from '@/api/aiot/measurementTasks'
import type { VibrationRecordsVO } from '@/api/aiot/vibrationRecords'

const message = useMessage()
const props = defineProps<{
  taskId: number
  sensorId: number
}>()
const emits = defineEmits(['success'])

const dialogVisible = ref(false)
const formLoading = ref(false)
const fileList = ref<any[]>([])
const uploadRef = ref()

const open = () => {
  dialogVisible.value = true
  fileList.value = []
}

defineExpose({ open })

const parseCsv = async (file: File) => {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const headers = lines.shift()?.split(/,\s*/) || []
  return lines.map((line) => {
    const cols = line.split(/,\s*/)
    const obj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim()
    })
    return obj
  })
}

const submitForm = async () => {
  if (fileList.value.length === 0) {
    message.error('请上传文件')
    return
  }
  const file = fileList.value[0].raw as File
  formLoading.value = true
  try {
    const rows = await parseCsv(file)
    const list: VibrationRecordsVO[] = rows.map((row) => ({
      taskId: props.taskId,
      sensorId: props.sensorId,
      timestamp: new Date(Number(row.Timestamp) || Date.parse(row.Timestamp)),
      xAxisRms: Number(row.X_Axis_RMS),
      yAxisRms: Number(row.Y_Axis_RMS),
      zAxisRms: Number(row.Z_Axis_RMS),
      xAxisMaRms: Number(row.X_Axis_MovingAvgRMS),
      yAxisMaRms: Number(row.Y_Axis_MovingAvgRMS),
      zAxisMaRms: Number(row.Z_Axis_MovingAvgRMS),
      xAxisPeakToPeak: Number(row.X_Axis_PeaktoPeak),
      yAxisPeakToPeak: Number(row.Y_Axis_PeaktoPeak),
      zAxisPeakToPeak: Number(row.Z_Axis_PeaktoPeak)
    }))
    await MeasurementTasksApi.batchCreateVibrationRecords({ list })
    message.success('导入成功')
    dialogVisible.value = false
    emits('success')
  } catch (e) {
    message.error('导入失败')
  } finally {
    formLoading.value = false
  }
}
</script>
