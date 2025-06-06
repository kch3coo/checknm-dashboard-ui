import request from '@/config/axios'

// 传感器信息 VO
export interface SensorInfoVO {
  id: number // 传感器ID
  uuid: string // UUID
  mac: string // MAC
  gatewayMac: string // 网关MAC
  type: number // 类型
  producer: string // 厂商
  qrCode: string // 二维码
  version: string // 版本信息
  status: number // 状态
}

// 传感器信息 API
export const SensorInfoApi = {
  // 查询传感器信息分页
  getSensorInfoPage: async (params: any) => {
    return await request.get({ url: `/aiot/sensor-info/page`, params })
  },

  // 查询传感器信息详情
  getSensorInfo: async (id: number) => {
    return await request.get({ url: `/aiot/sensor-info/get?id=` + id })
  },

  // 新增传感器信息
  createSensorInfo: async (data: SensorInfoVO) => {
    return await request.post({ url: `/aiot/sensor-info/create`, data })
  },

  // 修改传感器信息
  updateSensorInfo: async (data: SensorInfoVO) => {
    return await request.put({ url: `/aiot/sensor-info/update`, data })
  },

  // 删除传感器信息
  deleteSensorInfo: async (id: number) => {
    return await request.delete({ url: `/aiot/sensor-info/delete?id=` + id })
  },

  // 导出传感器信息 Excel
  exportSensorInfo: async (params) => {
    return await request.download({ url: `/aiot/sensor-info/export-excel`, params })
  }
}
