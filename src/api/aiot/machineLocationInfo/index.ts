import request from '@/config/axios'

// 设备位置信息 VO
export interface MachineLocationInfoVO {
  qrCode: string // 设备位置二维码
  machineId: number // 设备id
  sensorId: number // 传感器id
  locationInfo: string // 设备位置
  latestResult: number // 最新检测结果
  lastCheckTime: Date // 最新检测时间
  lastMaintainer: string // 最新检测人员
  locationImage: Blob // 设备位置图片
}

// 设备位置信息 API
export const MachineLocationInfoApi = {
  // 查询设备位置信息分页
  getMachineLocationInfoPage: async (params: any) => {
    return await request.get({ url: `/aiot/machine-location-info/page`, params })
  },

  // 查询设备位置信息详情
  getMachineLocationInfo: async (id: number) => {
    return await request.get({ url: `/aiot/machine-location-info/get?id=` + id })
  },

  // 新增设备位置信息
  createMachineLocationInfo: async (data: MachineLocationInfoVO) => {
    return await request.post({ url: `/aiot/machine-location-info/create`, data })
  },

  // 修改设备位置信息
  updateMachineLocationInfo: async (data: MachineLocationInfoVO) => {
    return await request.put({ url: `/aiot/machine-location-info/update`, data })
  },

  // 删除设备位置信息
  deleteMachineLocationInfo: async (id: number) => {
    return await request.delete({ url: `/aiot/machine-location-info/delete?id=` + id })
  },

  // 导出设备位置信息 Excel
  exportMachineLocationInfo: async (params) => {
    return await request.download({ url: `/aiot/machine-location-info/export-excel`, params })
  }
}
