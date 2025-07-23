import { watch } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { getRefreshToken } from '@/utils/auth'

export interface StartStreamOptions {
  recordType: number
  recordMethod: number
  timer: number
}

export interface WebSocketClientOptions {
  onMessage?: (data: string) => void
  onStatus?: (status: string) => void
  onOpen?: () => void
  onClose?: () => void
}

export function useWebSocketClient(options: WebSocketClientOptions = {}) {
  const server =
    (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken()

  const {
    status,
    data,
    send: rawSend,
    close,
    open
  } = useWebSocket(server, {
    autoReconnect: false,
    heartbeat: false,
    immediate: false,
    // 连接成功时触发
    onConnected: (ws) => {
      // console.log('WebSocket 已连接', ws)
      options.onOpen?.()
    },
    // 连接断开时触发
    onDisconnected: (_ws, event) => {
      // console.log('WebSocket 已断开', event)
      // console.log('关闭代码:', event.code)
      // console.log('关闭原因:', event.reason)
      options.onClose?.()
    },
    // 任意错误时触发
    onError: (_ws, event) => {
      console.error('WebSocket 错误', event)
    },
    // 原生消息事件
    onMessage: (_ws, ev) => {
      // console.log('WebSocket 收到消息', ev)
      let raw: string
      if (typeof ev.data === 'string') {
        raw = ev.data
      } else {
        raw = new TextDecoder().decode(ev.data as ArrayBuffer)
      }
      options.onMessage?.(raw)
    }
  })

  // 统一封装 send
  const send = (msg: any) => {
    // console.log('发送信息： ', msg)
    rawSend(JSON.stringify(msg))
  }

  const connectSensor = (sensorId?: number) => {
    if (!sensorId) return
    send({
      type: 'aiot-connect-sensor',
      content: { sensorId }
    })
  }

  const startStream = (opts: StartStreamOptions) => {
    send({
      type: 'aiot-start-stream-data',
      content: opts
    })
  }

  const stopStream = () => {
    send({ type: 'aiot-stop-stream-data', content: {} })
  }

  // 仍然可以监听 status 做额外处理
  watch(status, (s) => {
    // console.log('WebSocket 状态变更:', s)
    options.onStatus?.(s)
  })

  return {
    send,
    close,
    open,
    status,
    connectSensor,
    startStream,
    stopStream
  }
}
