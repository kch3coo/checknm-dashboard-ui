<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="公司名称" prop="companyName">
        <el-input v-model="formData.companyName" placeholder="请输入公司名称" />
      </el-form-item>
      <el-form-item label="工厂名称" prop="factoryName">
        <el-input v-model="formData.factoryName" placeholder="请输入工厂名称" />
      </el-form-item>
      <el-form-item label="设备产线" prop="productLine">
        <el-input v-model="formData.productLine" placeholder="请输入设备产线" />
      </el-form-item>
      <el-form-item label="设备名称" prop="deviceName">
        <el-input v-model="formData.deviceName" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备类型" prop="deviceType">
        <el-input v-model="formData.deviceType" placeholder="请输入设备类型" />
      </el-form-item>
      <el-form-item label="设备图片" prop="deviceImage">
        <UploadLocalImg v-model="formData.deviceImage" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { MachineInfoApi, MachineInfoVO } from '@/api/aiot/machineInfo'
import { ImageUtils } from '@/utils/ImageUtils'
/** 设备信息 表单 */
defineOptions({ name: 'MachineInfoForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  companyName: undefined,
  factoryName: undefined,
  productLine: undefined,
  deviceName: undefined,
  deviceType: undefined,
  deviceImage: undefined
})
const formRules = reactive({
  companyName: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }],
  deviceName: [{ required: true, message: '设备名称不能为空', trigger: 'blur' }],
  deviceType: [{ required: true, message: '设备类型不能为空', trigger: 'blur' }]
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
      formData.value = await MachineInfoApi.getMachineInfo(id)
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
    console.log(formData.value)
    const machineInfoVO: MachineInfoVO = {
      id: formData.value.id!,
      companyName: formData.value.companyName!,
      factoryName: formData.value.factoryName!,
      productLine: formData.value.productLine!,
      deviceName: formData.value.deviceName!,
      deviceType: formData.value.deviceType!,
      deviceImage: [] // 占位，后面赋值
    }
    console.log(machineInfoVO)

    // 转换 deviceImage
    if (formData.value.deviceImage) {
      machineInfoVO.deviceImage = await ImageUtils.toNumberArray(formData.value.deviceImage)
    }

    if (formType.value === 'create') {
      await MachineInfoApi.createMachineInfo(machineInfoVO)
      message.success(t('common.createSuccess'))
    } else {
      await MachineInfoApi.updateMachineInfo(machineInfoVO)
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
    companyName: undefined,
    factoryName: undefined,
    productLine: undefined,
    deviceName: undefined,
    deviceType: undefined,
    deviceImage: undefined
  }
  formRef.value?.resetFields()
}
</script>
