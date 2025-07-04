<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="传感器ID" prop="sensorId">
        <el-input v-model="formData.sensorId" placeholder="请输入传感器ID" readonly />
      </el-form-item>
      <el-form-item label="数据采集时间" prop="timestamp">
        <el-date-picker
          v-model="formData.timestamp"
          type="datetime"
          format="YYYY-MM-DD HH:mm:ss.SSS"
          value-format="x"
          placeholder="选择数据采集时间"
        />
      </el-form-item>
      <el-form-item label="X轴有效值 (RMS)" prop="xAxisRms">
        <el-input v-model="formData.xAxisRms" placeholder="请输入X轴有效值 (RMS)" />
      </el-form-item>
      <el-form-item label="Y轴有效值 (RMS)" prop="yAxisRms">
        <el-input v-model="formData.yAxisRms" placeholder="请输入Y轴有效值 (RMS)" />
      </el-form-item>
      <el-form-item label="Z轴有效值 (RMS)" prop="zAxisRms">
        <el-input v-model="formData.zAxisRms" placeholder="请输入Z轴有效值 (RMS)" />
      </el-form-item>
      <el-form-item label="X轴移动平均有效值" prop="xAxisMaRms">
        <el-input v-model="formData.xAxisMaRms" placeholder="请输入X轴移动平均有效值" />
      </el-form-item>
      <el-form-item label="Y轴移动平均有效值" prop="yAxisMaRms">
        <el-input v-model="formData.yAxisMaRms" placeholder="请输入Y轴移动平均有效值" />
      </el-form-item>
      <el-form-item label="Z轴移动平均有效值" prop="zAxisMaRms">
        <el-input v-model="formData.zAxisMaRms" placeholder="请输入Z轴移动平均有效值" />
      </el-form-item>
      <el-form-item label="X轴峰值-峰值" prop="xAxisPeakToPeak">
        <el-input v-model="formData.xAxisPeakToPeak" placeholder="请输入X轴峰值-峰值" />
      </el-form-item>
      <el-form-item label="Y轴峰值-峰值" prop="yAxisPeakToPeak">
        <el-input v-model="formData.yAxisPeakToPeak" placeholder="请输入Y轴峰值-峰值" />
      </el-form-item>
      <el-form-item label="Z轴峰值-峰值" prop="zAxisPeakToPeak">
        <el-input v-model="formData.zAxisPeakToPeak" placeholder="请输入Z轴峰值-峰值" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { MeasurementTasksApi } from '@/api/aiot/measurementTasks'
import { VibrationRecordsVO } from '@/api/aiot/vibrationRecords'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = reactive<Partial<VibrationRecordsVO>>({})
const formRules = reactive({
  sensorId: [{ required: true, message: '传感器ID不能为空', trigger: 'blur' }],
  taskId: [{ required: true, message: '任务ID不能为空', trigger: 'blur' }],
  timestamp: [{ required: true, message: '数据采集时间不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗
 * @param type   - create 或 update
 * @param taskId   - 父级任务 ID，必填
 * @param sensorId - 传感器 ID，必填
 * @param id       - 如果是 update，就传要编辑的记录 ID；create 时不传
 */
const open = async (type: 'create' | 'update', taskId: number, sensorId: number, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm(taskId, sensorId)
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await MeasurementTasksApi.getVibrationRecords(id)
      Object.assign(formData, data)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData
    if (formType.value === 'create') {
      await MeasurementTasksApi.createVibrationRecords(data)
      message.success(t('common.createSuccess'))
    } else {
      await MeasurementTasksApi.updateVibrationRecords(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = (keepTaskId?: number, keepSensorId?: number) => {
  Object.assign(formData, {
    id: undefined,
    sensorId: keepSensorId ?? undefined,
    taskId: keepTaskId ?? undefined,
    timestamp: undefined,
    xAxisRms: undefined,
    yAxisRms: undefined,
    zAxisRms: undefined,
    xAxisMaRms: undefined,
    yAxisMaRms: undefined,
    zAxisMaRms: undefined,
    xAxisPeakToPeak: undefined,
    yAxisPeakToPeak: undefined,
    zAxisPeakToPeak: undefined
  })
  formRef.value?.resetFields()
}
</script>
