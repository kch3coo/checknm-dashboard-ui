<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="设备位置图片" prop="locationImage">
        <UploadLocalImg v-model="formData.locationImage" />
      </el-form-item>
      <el-form-item label="设备位置二维码" prop="qrCode">
        <el-input v-model="formData.qrCode" placeholder="请输入设备位置二维码" />
      </el-form-item>
      <el-form-item label="传感器id" prop="sensorId">
        <el-input v-model="formData.sensorId" placeholder="请输入传感器id" />
      </el-form-item>
      <el-form-item label="设备位置" prop="locationInfo">
        <el-input v-model="formData.locationInfo" placeholder="请输入设备位置" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { MachineInfoApi } from '@/api/aiot/machineInfo'
import { MachineLocationInfoVO } from '@/api/aiot/machineLocationInfo'
import { ImageUtils } from '@/utils/ImageUtils'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
let formData = reactive<Partial<MachineLocationInfoVO>>({})
const formRules = reactive({
  qrCode: [{ required: true, message: '设备位置二维码不能为空', trigger: 'blur' }],
  machineId: [{ required: true, message: '设备id不能为空', trigger: 'blur' }],
  locationInfo: [{ required: true, message: '设备位置不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, machineId: number, machineInfoId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.machineId = machineId
  // 修改时，设置数据
  if (machineInfoId) {
    formLoading.value = true
    try {
      formData = await MachineInfoApi.getMachineLocationInfo(machineInfoId)
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
    const data: MachineLocationInfoVO = {
      qrCode: formData.qrCode ?? '',
      machineId: formData.machineId!,
      sensorId: formData.sensorId!,
      locationInfo: formData.locationInfo ?? '',
      // 先给个默认空数组
      locationImage: []
    }

    if (formData.locationImage) {
      data.locationImage = await ImageUtils.toNumberArray(formData.locationImage)
    }

    if (formType.value === 'create') {
      await MachineInfoApi.createMachineLocationInfo(data)
      message.success(t('common.createSuccess'))
    } else {
      await MachineInfoApi.updateMachineLocationInfo(data)
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
  Object.assign(formData, {
    id: undefined,
    qrCode: undefined,
    machineId: undefined,
    sensorId: undefined,
    locationInfo: undefined,
    locationImage: []
  })
  formRef.value?.resetFields()
}
</script>
