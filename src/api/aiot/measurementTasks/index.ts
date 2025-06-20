import request from '@/config/axios'

// 检测任务记录 VO
export interface MeasurementTasksVO {
  id: number // 任务id
  sensorId: number // 传感器id
  machineLocationId: number // 设备位置id
  maintainer: string // 检测人员
  type: number // 检测类型
  method: number // 检测方法
  startTime: Date // 开始时间
  endTime: Date // 结束时间
  status: number // 检测状态
}

// 检测任务记录 API
export const MeasurementTasksApi = {
  // 查询检测任务记录分页
  getMeasurementTasksPage: async (params: any) => {
    return await request.get({ url: `/aiot/measurement-tasks/page`, params })
  },

  // 查询检测任务记录详情
  getMeasurementTasks: async (id: number) => {
    return await request.get({ url: `/aiot/measurement-tasks/get?id=` + id })
  },

  // 新增检测任务记录
  createMeasurementTasks: async (data: MeasurementTasksVO) => {
    return await request.post({ url: `/aiot/measurement-tasks/create`, data })
  },

  // 修改检测任务记录
  updateMeasurementTasks: async (data: MeasurementTasksVO) => {
    return await request.put({ url: `/aiot/measurement-tasks/update`, data })
  },

  // 删除检测任务记录
  deleteMeasurementTasks: async (id: number) => {
    return await request.delete({ url: `/aiot/measurement-tasks/delete?id=` + id })
  },

  // 导出检测任务记录 Excel
  exportMeasurementTasks: async (params) => {
    return await request.download({ url: `/aiot/measurement-tasks/export-excel`, params })
  },

  // ==================== 子表（振动传感记录） ====================

  // 获得振动传感记录分页
  getVibrationRecordsPage: async (params) => {
    return await request.get({ url: `/aiot/measurement-tasks/vibration-records/page`, params })
  },
  // 新增振动传感记录
  createVibrationRecords: async (data) => {
    return await request.post({ url: `/aiot/measurement-tasks/vibration-records/create`, data })
  },

  // 批量新增振动传感记录
  batchCreateVibrationRecords: async (data) => {
    return await request.post({ url: `/aiot/measurement-tasks/vibration-records/batch-create`, data })
  },

  // 修改振动传感记录
  updateVibrationRecords: async (data) => {
    return await request.put({ url: `/aiot/measurement-tasks/vibration-records/update`, data })
  },

  // 删除振动传感记录
  deleteVibrationRecords: async (id: number) => {
    return await request.delete({
      url: `/aiot/measurement-tasks/vibration-records/delete?id=` + id
    })
  },

  // 获得振动传感记录
  getVibrationRecords: async (id: number) => {
    return await request.get({ url: `/aiot/measurement-tasks/vibration-records/get?id=` + id })
  }
}
