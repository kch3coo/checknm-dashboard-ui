<template>
  <!-- 列表 -->
  <ContentWrap>
    <template v-if="!props.tasks || props.tasks.length === 0">
      <el-button
        type="primary"
        plain
        @click="openForm('create')"
        v-hasPermi="['aiot:measurement-tasks:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增
      </el-button>
      <el-button
        v-if="total === 0"
        type="warning"
        plain
        @click="handleImport"
        v-hasPermi="['aiot:measurement-tasks:create']"
      >
        <Icon icon="ep:upload" class="mr-5px" /> 导入
      </el-button>
    </template>
    <template v-if="props.tasks && props.tasks.length > 1">
      <el-tabs v-model="activeTaskId" class="mb-10px">
        <el-tab-pane
          v-for="t in props.tasks"
          :key="t.id"
          :label="formatDate(t.startTime)"
          :name="t.id"
        />
      </el-tabs>
    </template>
    <el-table v-loading="loading" :data="currentList" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="传感器ID" align="center" prop="sensorId" />

      <el-table-column
        label="数据采集时间"
        align="center"
        prop="timestamp"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="X轴有效值 (RMS)" align="center" prop="xAxisRms" />
      <el-table-column label="Y轴有效值 (RMS)" align="center" prop="yAxisRms" />
      <el-table-column label="Z轴有效值 (RMS)" align="center" prop="zAxisRms" />
      <el-table-column label="X轴移动平均有效值" align="center" prop="xAxisMaRms" />
      <el-table-column label="Y轴移动平均有效值" align="center" prop="yAxisMaRms" />
      <el-table-column label="Z轴移动平均有效值" align="center" prop="zAxisMaRms" />
      <el-table-column label="X轴峰值-峰值" align="center" prop="xAxisPeakToPeak" />
      <el-table-column label="Y轴峰值-峰值" align="center" prop="yAxisPeakToPeak" />
      <el-table-column label="Z轴峰值-峰值" align="center" prop="zAxisPeakToPeak" />
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
    <template v-if="!props.tasks || props.tasks.length === 0">
      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </template>
  </ContentWrap>
  <!-- 表单弹窗：添加/修改 -->
  <VibrationRecordsForm ref="formRef" @success="getList" />
  <!-- 导入弹窗 -->
  <VibrationRecordsImportForm
    :task-id="props.taskId!"
    :sensor-id="props.sensorId!"
    ref="importRef"
    @success="getList"
  />
</template>
<script setup lang="ts">
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { MeasurementTasksApi } from '@/api/aiot/measurementTasks'
import { ref, reactive, computed, watch } from 'vue'
import VibrationRecordsForm from './VibrationRecordsForm.vue'
import VibrationRecordsImportForm from './VibrationRecordsImportForm.vue'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const props = defineProps<{
  taskId?: number // 任务ID（主表的关联字段）
  sensorId?: number // 传感器ID（主表字段）
  tasks?: any[] // 多个任务
}>()
const loading = ref(false) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const recordsMap = reactive<Record<number, any[]>>({})
const activeTaskId = ref<number>()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as unknown
})
const currentList = computed(() => {
  if (props.tasks && props.tasks.length) {
    return recordsMap[activeTaskId.value!] || []
  }
  return list.value
})

const loadTaskRecords = async (taskId: number) => {
  loading.value = true
  try {
    const data = await MeasurementTasksApi.getVibrationRecordsPage({
      pageNo: 1,
      pageSize: 1000,
      taskId
    })
    recordsMap[taskId] = data.list || []
  } finally {
    loading.value = false
  }
}

/** 查询列表 */
const getList = async () => {
  if (props.tasks && props.tasks.length) return
  loading.value = true
  try {
    const data = await MeasurementTasksApi.getVibrationRecordsPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const importRef = ref()
const openForm = (type: string, id?: number) => {
  if (!props.taskId || !props.sensorId) {
    message.error('请选择一个检测任务记录')
    return
  }
  formRef.value.open(type, props.taskId, props.sensorId, id)
}

/** 导入按钮操作 */
const handleImport = () => {
  if (!props.taskId || !props.sensorId) {
    message.error('请选择一个检测任务记录')
    return
  }
  importRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await MeasurementTasksApi.deleteVibrationRecords(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.taskId,
  (val: number) => {
    if (!val) {
      return
    }
    queryParams.taskId = val
    handleQuery()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.tasks,
  (val) => {
    if (Array.isArray(val) && val.length) {
      activeTaskId.value = val[0].id
      val.forEach((t: any) => loadTaskRecords(t.id))
    } else {
      activeTaskId.value = undefined
    }
  },
  { immediate: true, deep: true }
)
</script>
