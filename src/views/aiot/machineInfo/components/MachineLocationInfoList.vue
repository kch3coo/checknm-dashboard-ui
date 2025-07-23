<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-button
      type="primary"
      plain
      @click="openForm('create')"
      v-hasPermi="['aiot:machine-info:create']"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 新增
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="设备位置id" align="center" prop="id" />
      <el-table-column label="设备位置图片" align="center">
        <template #default="{ row }">
          <img
            v-if="row.locationImageUrl"
            :src="row.locationImageUrl"
            style="max-height: 60px; max-width: 100px"
            alt="设备位置图片"
          />
        </template>
      </el-table-column>
      <el-table-column label="设备位置二维码" align="center" prop="qrCode" />
      <el-table-column label="传感器id" align="center" prop="sensorId" />
      <el-table-column label="设备位置" align="center" prop="locationInfo" />
      <el-table-column label="最新检测结果" align="center" prop="latestResult" />
      <el-table-column
        label="最新检测时间"
        align="center"
        prop="lastCheckTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="最新检测人员" align="center" prop="lastMaintainer" />

      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['aiot:machine-info:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['aiot:machine-info:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <MachineLocationInfoForm ref="formRef" @success="getList" />
</template>
<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { MachineInfoApi } from '@/api/aiot/machineInfo'
import MachineLocationInfoForm from './MachineLocationInfoForm.vue'
import { makeDataUrl } from '@/components/UploadFile/src/uploadImgUtil'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const props = defineProps<{
  machineId?: number // 设备id（主表的关联字段）
}>()
const loading = ref(false) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  machineId: undefined as unknown
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MachineInfoApi.getMachineLocationInfoPage(queryParams)
    list.value = data.list.map((item) => ({
      ...item,
      locationImageUrl: makeDataUrl(item.locationImage)
    }))
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, machineInfoId?: number) => {
  if (!props.machineId) {
    message.error('请选择一个设备信息')
    return
  }
  formRef.value.open(type, props.machineId, machineInfoId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MachineInfoApi.deleteMachineLocationInfo(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.machineId,
  (val) => {
    console.log('🛠 machineId changed:', val)
    if (!val) {
      return
    }
    queryParams.machineId = val
    handleQuery()
  },
  { immediate: true, deep: true }
)
</script>
