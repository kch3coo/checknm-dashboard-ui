<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="UUID" prop="uuid">
        <el-input
          v-model="queryParams.uuid"
          placeholder="请输入UUID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="MAC" prop="mac">
        <el-input
          v-model="queryParams.mac"
          placeholder="请输入MAC"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="网关MAC" prop="gatewayMac">
        <el-input
          v-model="queryParams.gatewayMac"
          placeholder="请输入网关MAC"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="类型：0：WIRED；1：WIRELESS" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择类型：0：WIRED；1：WIRELESS"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item label="厂商" prop="producer">
        <el-input
          v-model="queryParams.producer"
          placeholder="请输入厂商"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="二维码" prop="qrCode">
        <el-input
          v-model="queryParams.qrCode"
          placeholder="请输入二维码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="版本信息：KSCM-M12" prop="version">
        <el-input
          v-model="queryParams.version"
          placeholder="请输入版本信息：KSCM-M12"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态：0：CONNECT；1：DISCONNECT；2：DISABLED" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态：0：CONNECT；1：DISCONNECT；2：DISABLED"
          clearable
          class="!w-240px"
        >
          <el-option label="请选择字典生成" value="" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['aiot:sensor-info:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['aiot:sensor-info:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="传感器ID" align="center" prop="id" />
      <el-table-column label="UUID" align="center" prop="uuid" />
      <el-table-column label="MAC" align="center" prop="mac" />
      <el-table-column label="网关MAC" align="center" prop="gatewayMac" />
      <el-table-column label="类型：0：WIRED；1：WIRELESS" align="center" prop="type" />
      <el-table-column label="厂商" align="center" prop="producer" />
      <el-table-column label="二维码" align="center" prop="qrCode" />
      <el-table-column label="版本信息：KSCM-M12" align="center" prop="version" />
      <el-table-column
        label="状态：0：CONNECT；1：DISCONNECT；2：DISABLED"
        align="center"
        prop="status"
      />
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['aiot:sensor-info:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['aiot:sensor-info:delete']"
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
  <SensorInfoForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import download from '@/utils/download'
import { SensorInfoApi, SensorInfoVO } from '@/api/aiot/sensorinfo'
import SensorInfoForm from './SensorInfoForm.vue'

/** 传感器信息 列表 */
defineOptions({ name: 'SensorInfo' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<SensorInfoVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  uuid: undefined,
  mac: undefined,
  gatewayMac: undefined,
  type: undefined,
  producer: undefined,
  qrCode: undefined,
  version: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SensorInfoApi.getSensorInfoPage(queryParams)
    list.value = data.list
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

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SensorInfoApi.deleteSensorInfo(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await SensorInfoApi.exportSensorInfo(queryParams)
    download.excel(data, '传感器信息.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
