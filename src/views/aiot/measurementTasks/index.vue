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
      <el-form-item label="传感器id" prop="sensorId">
        <el-input
          v-model="queryParams.sensorId"
          placeholder="请输入传感器id"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务id" prop="id">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入任务id"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="设备位置id" prop="machineLocationId">
        <el-input
          v-model="queryParams.machineLocationId"
          placeholder="请输入设备位置id"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="检测人员" prop="maintainer">
        <el-input
          v-model="queryParams.maintainer"
          placeholder="请输入检测人员"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="检测类型" prop="type">
        <el-select
          v-model="queryParams.type"
          placeholder="请选择检测类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_MEASUREMENT_TASK_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="检测方法" prop="method">
        <el-select
          v-model="queryParams.method"
          placeholder="请选择检测方法"
          clearable
          class="!w-240px"
        >
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
          v-model="queryParams.startTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="检测状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择检测状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AIOT_MEASUREMENT_TASK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['aiot:measurement-tasks:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="success" plain @click="toggleCompare">
          <Icon icon="ep:odometer" class="mr-5px" />
          {{ compareMode ? '完成对比' : '前后量化对比' }}
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      :highlight-current-row="!compareMode"
      row-key="id"
      @current-change="onCurrentChange"
      @select="handleCompareSelect"
    >
      <el-table-column type="selection" width="55" v-if="compareMode" />
      <el-table-column label="传感器id" align="center" prop="sensorId" />
      <el-table-column label="任务id" align="center" prop="id" />
      <el-table-column label="设备位置id" align="center" prop="machineLocationId" />
      <el-table-column label="检测人员" align="center" prop="maintainer" />
      <el-table-column label="检测类型" align="center" prop="type">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AIOT_MEASUREMENT_TASK_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="检测方法" align="center" prop="method">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AIOT_MEASUREMENT_TASK_METHOD" :value="scope.row.method" />
        </template>
      </el-table-column>
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column
        label="结束时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="检测状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AIOT_MEASUREMENT_TASK_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['aiot:measurement-tasks:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['aiot:measurement-tasks:delete']"
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
  <MeasurementTasksForm ref="formRef" @success="getList" />
  <!-- 子表的列表 -->
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="振动传感记录" name="vibrationRecords">
        <VibrationRecordsList
          v-if="!compareMode"
          key="single-records"
          :task-id="currentRow.id"
          :sensor-id="currentRow.sensorId"
        />
        <VibrationRecordsList v-else key="compare-records" :tasks="selectedTasks" />
      </el-tab-pane>
      <el-tab-pane label="振动图表" name="vibrationGraph">
        <VibrationGraph
          v-if="!compareMode"
          key="single-graph"
          :task-ids="currentRow.id ? [currentRow.id] : []"
        />
        <VibrationGraph v-else key="compare-graph" :task-ids="selectedTasks.map((t) => t.id)" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { MeasurementTasksApi, MeasurementTasksVO } from '@/api/aiot/measurementTasks'
import MeasurementTasksForm from './MeasurementTasksForm.vue'
import VibrationRecordsList from './components/VibrationRecordsList.vue'
import VibrationGraph from './components/VibrationGraph.vue'

/** 检测任务记录 列表 */
defineOptions({ name: 'MeasurementTasks' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<MeasurementTasksVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  sensorId: undefined,
  id: undefined,
  machineLocationId: undefined,
  maintainer: undefined,
  type: undefined,
  method: undefined,
  startTime: [],
  endTime: [],
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const activeTab = ref('vibrationRecords')
const compareMode = ref(false)
const selectedTasks = ref<MeasurementTasksVO[]>([])
const tableRef = ref()

const onCurrentChange = (row: MeasurementTasksVO) => {
  if (!compareMode.value) {
    handleCurrentChange(row)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MeasurementTasksApi.getMeasurementTasksPage(queryParams)
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

const toggleCompare = () => {
  if (compareMode.value) {
    compareMode.value = false
    selectedTasks.value = []
    currentRow.value = {}
    tableRef.value?.clearSelection()
  } else {
    compareMode.value = true
    selectedTasks.value = []
    currentRow.value = {}
    tableRef.value?.clearSelection()
  }
}

const handleCompareSelect = (rows: MeasurementTasksVO[], _row: MeasurementTasksVO) => {
  if (!compareMode.value) return
  if (!tableRef.value) return

  if (rows.length <= 2) {
    selectedTasks.value = rows.slice()
    return
  }

  const keep = rows.slice(-2)
  selectedTasks.value = keep
  tableRef.value?.clearSelection()
  keep.forEach((r) => tableRef.value?.toggleRowSelection(r, true))
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
    await MeasurementTasksApi.deleteMeasurementTasks(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 选中行操作 */
const currentRow = ref<Partial<MeasurementTasksVO>>({}) // 选中行
const handleCurrentChange = (row) => {
  if (!compareMode.value) {
    currentRow.value = row
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
