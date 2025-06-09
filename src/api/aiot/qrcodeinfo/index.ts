import request from '@/config/axios'

// 二维码信息 VO
export interface QrcodeInfoVO {
  id: number // 二维码id
  info: string // 二维码信息
  type: string // 二维码类型
  status: number // 二维码状态
}

// 二维码信息 API
export const QrcodeInfoApi = {
  // 查询二维码信息分页
  getQrcodeInfoPage: async (params: any) => {
    return await request.get({ url: `/aiot/qrcode-info/page`, params })
  },

  // 查询二维码信息详情
  getQrcodeInfo: async (id: number) => {
    return await request.get({ url: `/aiot/qrcode-info/get?id=` + id })
  },

  // 新增二维码信息
  createQrcodeInfo: async (data: QrcodeInfoVO) => {
    return await request.post({ url: `/aiot/qrcode-info/create`, data })
  },

  // 修改二维码信息
  updateQrcodeInfo: async (data: QrcodeInfoVO) => {
    return await request.put({ url: `/aiot/qrcode-info/update`, data })
  },

  // 删除二维码信息
  deleteQrcodeInfo: async (id: number) => {
    return await request.delete({ url: `/aiot/qrcode-info/delete?id=` + id })
  },

  // 导出二维码信息 Excel
  exportQrcodeInfo: async (params) => {
    return await request.download({ url: `/aiot/qrcode-info/export-excel`, params })
  }
}
