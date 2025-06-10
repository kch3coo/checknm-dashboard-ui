<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="传感器id" prop="sensorId">
        <el-input v-model="formData.sensorId" placeholder="请输入传感器id" />
      </el-form-item>
      <el-form-item label="设备位置id" prop="machineLocationId">
        <el-input v-model="formData.machineLocationId" placeholder="请输入设备位置id" />
      </el-form-item>
      <el-form-item label="检测人员" prop="maintainer">
        <el-input v-model="formData.maintainer" placeholder="请输入检测人员" />
      </el-form-item>
      <el-form-item label="检测类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择检测类型">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_MEASUREMENT_TASK_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="检测方法" prop="method">
        <el-select v-model="formData.method" placeholder="请选择检测方法">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_MEASUREMENT_TASK_METHOD)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="date"
          value-format="x"
          placeholder="选择开始时间"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="date"
          value-format="x"
          placeholder="选择结束时间"
        />
      </el-form-item>
      <el-form-item label="检测状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_MEASUREMENT_TASK_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { MeasurementTasksApi, MeasurementTasksVO } from '@/api/aiot/measurementTasks'

/** 检测任务记录 表单 */
defineOptions({ name: 'MeasurementTasksForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  sensorId: undefined,
  id: undefined,
  machineLocationId: undefined,
  maintainer: undefined,
  type: undefined,
  method: undefined,
  startTime: undefined,
  endTime: undefined,
  status: undefined
})
const formRules = reactive({
  sensorId: [{ required: true, message: '传感器id不能为空', trigger: 'blur' }],
  machineLocationId: [{ required: true, message: '设备位置id不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '检测类型不能为空', trigger: 'change' }],
  method: [{ required: true, message: '检测方法不能为空', trigger: 'change' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'blur' }],
  endTime: [{ required: true, message: '结束时间不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MeasurementTasksApi.getMeasurementTasks(id)
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
    const data = formData.value as unknown as MeasurementTasksVO
    if (formType.value === 'create') {
      await MeasurementTasksApi.createMeasurementTasks(data)
      message.success(t('common.createSuccess'))
    } else {
      await MeasurementTasksApi.updateMeasurementTasks(data)
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
const resetForm = () => {
  formData.value = {
    sensorId: undefined,
    id: undefined,
    machineLocationId: undefined,
    maintainer: undefined,
    type: undefined,
    method: undefined,
    startTime: undefined,
    endTime: undefined,
    status: undefined
  }
  formRef.value?.resetFields()
}
</script>
