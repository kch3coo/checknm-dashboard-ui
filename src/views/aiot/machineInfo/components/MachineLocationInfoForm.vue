<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    v-loading="formLoading"
    label-width="0px"
    :inline-message="true"
  >
    <el-table :data="formData" class="-mt-10px">
      <el-table-column label="设备位置图片" min-width="200">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.locationImage`" class="mb-0px!">
            <UploadLocalImg v-model="row.locationImage" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="设备位置二维码" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.qrCode`" :rules="formRules.qrCode" class="mb-0px!">
            <el-input v-model="row.qrCode" placeholder="请输入设备位置二维码" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="传感器id" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.sensorId`" class="mb-0px!">
            <el-input v-model="row.sensorId" placeholder="请输入传感器id" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="设备位置" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.locationInfo`"
            :rules="formRules.locationInfo"
            class="mb-0px!"
          >
            <el-input v-model="row.locationInfo" placeholder="请输入设备位置" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3">
    <el-button @click="handleAdd" round>+ 添加设备位置信息</el-button>
  </el-row>
</template>
<script setup lang="ts">
import { MachineInfoApi } from '@/api/aiot/machineInfo'
import { MachineLocationInfoVO } from '@/api/aiot/machineLocationInfo'

const props = defineProps<{
  machineId: number | undefined // 设备id（主表的关联字段）
}>()
const formLoading = ref(false) // 表单的加载中
const formData = ref<Partial<MachineLocationInfoVO>[]>([])
const formRules = reactive({
  qrCode: [{ required: true, message: '设备位置二维码不能为空', trigger: 'blur' }],
  machineId: [{ required: true, message: '设备id不能为空', trigger: 'blur' }],
  locationInfo: [{ required: true, message: '设备位置不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.machineId,
  async (val) => {
    // 1. 重置表单
    formData.value = []
    // 2. val 非空，则加载数据
    if (!val) {
      return
    }
    try {
      formLoading.value = true
      const fullList = await MachineInfoApi.getMachineLocationInfoListByMachineId(val)
      formData.value = fullList.map((item) => ({
        ...item,
        locationImage: item.locationImage
      }))
    } finally {
      formLoading.value = false
    }
  },
  { immediate: true }
)

/** 新增按钮操作 */
const handleAdd = () => {
  const row: Partial<MachineLocationInfoVO> = {
    machineId: props.machineId
  }
  row.machineId = props.machineId
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 表单值 */
const getData = () => {
  return formData.value
}

defineExpose({ validate, getData })
</script>
