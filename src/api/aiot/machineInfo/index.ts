import request from '@/config/axios'
import { MachineLocationInfoVO } from '../machineLocationInfo'

// 设备信息 VO
export interface MachineInfoVO {
  id: number //设备ID
  companyName: string // 公司名称
  factoryName: string // 工厂名称
  productLine: string // 设备产线
  deviceName: string // 设备名称
  deviceType: string // 设备类型
  deviceImage: number[] // 设备图片
}

// 设备信息 API
export const MachineInfoApi = {
  // 查询设备信息分页
  getMachineInfoPage: async (params: any) => {
    return await request.get({ url: `/aiot/machine-info/page`, params })
  },

  // 查询设备信息详情
  getMachineInfo: async (id: number) => {
    return await request.get({ url: `/aiot/machine-info/get?id=` + id })
  },

  // 新增设备信息
  createMachineInfo: async (data: MachineInfoVO) => {
    return await request.post({ url: `/aiot/machine-info/create`, data })
  },

  // 修改设备信息
  updateMachineInfo: async (data: MachineInfoVO) => {
    return await request.put({ url: `/aiot/machine-info/update`, data })
  },

  // 删除设备信息
  deleteMachineInfo: async (id: number) => {
    return await request.delete({ url: `/aiot/machine-info/delete?id=` + id })
  },

  // 导出设备信息 Excel
  exportMachineInfo: async (params) => {
    return await request.download({ url: `/aiot/machine-info/export-excel`, params })
  },

  // ==================== 子表（设备位置信息） ====================

  // 获得设备位置信息分页
  getMachineLocationInfoPage: async (params) => {
    return await request.get({ url: `/aiot/machine-info/machine-location-info/page`, params })
  },
  // 新增设备位置信息
  createMachineLocationInfo: async (data) => {
    return await request.post({ url: `/aiot/machine-info/machine-location-info/create`, data })
  },

  // 修改设备位置信息
  updateMachineLocationInfo: async (data) => {
    return await request.put({ url: `/aiot/machine-info/machine-location-info/update`, data })
  },

  // 删除设备位置信息
  deleteMachineLocationInfo: async (id: number) => {
    return await request.delete({ url: `/aiot/machine-info/machine-location-info/delete?id=` + id })
  },

  // 获得设备位置信息
  getMachineLocationInfo: async (id: number) => {
    return await request.get({ url: `/aiot/machine-info/machine-location-info/get?id=` + id })
  }
}
