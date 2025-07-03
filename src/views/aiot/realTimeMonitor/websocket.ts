export interface StartStreamOptions {
  recordType: number
  recordMethod: number
  timer: number
}
import { watch } from 'vue'
import { useWebSocket } from '@vueuse/core'
import { getRefreshToken } from '@/utils/auth'

export interface WebSocketClientOptions {
  onMessage?: (data: string) => void
  onStatus?: (status: string) => void
}

export function useWebSocketClient(options: WebSocketClientOptions = {}) {
  const server =
    (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken()

  const { status, data, send: rawSend, close, open } = useWebSocket(server, {
    autoReconnect: false,
    heartbeat: true,
    immediate: false
  })

  const send = (msg: any) => {
    rawSend(JSON.stringify(msg))
  }

  const connectSensor = (sensorId?: number) => {
    if (!sensorId) return
    send({
      type: 'aiot-connect-sensor',
      content: { sensorId }
    })
  }

  const startStream = (options: StartStreamOptions) => {
    send({ type: 'aiot-start-stream-data', content: options })
  }

  const stopStream = () => {
    send({ type: 'aiot-stop-stream-data', content: {} })
  }

  watch(status, (s) => options.onStatus?.(s))
  watch(data, (d) => options.onMessage?.(d as string))

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
