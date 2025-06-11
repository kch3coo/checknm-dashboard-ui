import request from '@/config/axios'

// 振动传感记录 VO
export interface VibrationRecordsVO {
  sensorId: number // 传感器ID
  taskId: number // 任务ID
  timestamp: Date // 数据采集时间
  xAxisRms: number // X轴有效值 (RMS)
  yAxisRms: number // Y轴有效值 (RMS)
  zAxisRms: number // Z轴有效值 (RMS)
  xAxisMaRms: number // X轴移动平均有效值
  yAxisMaRms: number // Y轴移动平均有效值
  zAxisMaRms: number // Z轴移动平均有效值
  xAxisPeakToPeak: number // X轴峰值-峰值
  yAxisPeakToPeak: number // Y轴峰值-峰值
  zAxisPeakToPeak: number // Z轴峰值-峰值
}

// 振动传感记录 API
export const VibrationRecordsApi = {
  // 查询振动传感记录分页
  getVibrationRecordsPage: async (params: any) => {
    return await request.get({ url: `/aiot/vibration-records/page`, params })
  },

  // 查询振动传感记录详情
  getVibrationRecords: async (id: number) => {
    return await request.get({ url: `/aiot/vibration-records/get?id=` + id })
  },

  // 新增振动传感记录
  createVibrationRecords: async (data: VibrationRecordsVO) => {
    return await request.post({ url: `/aiot/vibration-records/create`, data })
  },

  // 修改振动传感记录
  updateVibrationRecords: async (data: VibrationRecordsVO) => {
    return await request.put({ url: `/aiot/vibration-records/update`, data })
  },

  // 删除振动传感记录
  deleteVibrationRecords: async (id: number) => {
    return await request.delete({ url: `/aiot/vibration-records/delete?id=` + id })
  },

  // 导出振动传感记录 Excel
  exportVibrationRecords: async (params) => {
    return await request.download({ url: `/aiot/vibration-records/export-excel`, params })
  }
}
