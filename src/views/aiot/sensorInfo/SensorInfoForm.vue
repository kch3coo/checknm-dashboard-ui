<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="UUID" prop="uuid">
        <el-input v-model="formData.uuid" placeholder="请输入UUID" />
      </el-form-item>
      <el-form-item label="MAC" prop="mac">
        <el-input v-model="formData.mac" placeholder="请输入MAC" />
      </el-form-item>
      <el-form-item label="网关MAC" prop="gatewayMac">
        <el-input v-model="formData.gatewayMac" placeholder="请输入网关MAC" />
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择类型">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_SENSOR_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="厂商" prop="producer">
        <el-input v-model="formData.producer" placeholder="请输入厂商" />
      </el-form-item>
      <el-form-item label="二维码" prop="qrCode">
        <el-input v-model="formData.qrCode" placeholder="请输入二维码" />
      </el-form-item>
      <el-form-item label="版本信息" prop="version">
        <el-input v-model="formData.version" placeholder="请输入版本信息" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_SENSOR_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
import { SensorInfoApi, SensorInfoVO } from '@/api/aiot/sensorInfo'

/** 传感器信息 表单 */
defineOptions({ name: 'SensorInfoForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  uuid: undefined,
  mac: undefined,
  gatewayMac: undefined,
  type: undefined,
  producer: undefined,
  qrCode: undefined,
  version: undefined,
  status: undefined
})
const formRules = reactive({
  uuid: [{ required: true, message: 'UUID不能为空', trigger: 'blur' }],
  mac: [{ required: true, message: 'MAC不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
  qrCode: [{ required: true, message: '二维码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
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
      formData.value = await SensorInfoApi.getSensorInfo(id)
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
    const data = formData.value as unknown as SensorInfoVO
    if (formType.value === 'create') {
      await SensorInfoApi.createSensorInfo(data)
      message.success(t('common.createSuccess'))
    } else {
      await SensorInfoApi.updateSensorInfo(data)
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
    id: undefined,
    uuid: undefined,
    mac: undefined,
    gatewayMac: undefined,
    type: undefined,
    producer: undefined,
    qrCode: undefined,
    version: undefined,
    status: undefined
  }
  formRef.value?.resetFields()
}
</script>
