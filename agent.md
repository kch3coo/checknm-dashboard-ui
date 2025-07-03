# WebSocket 使用说明

以下文档说明如何在前端建立 WebSocket 连接并发送、接收数据。

## 1. 建立 WebSocket 连接

```js
const server = ref(
  (import.meta.env.VITE_BASE_URL + '/infra/ws').replace('http', 'ws') +
    '?token=' +
    getRefreshToken() // 注意：使用刷新令牌而非访问令牌
)

const getIsOpen = computed(() => status.value === 'OPEN') // 连接状态
const getTagColor = computed(() => (getIsOpen.value ? 'success' : 'red')) // 状态颜色标签

const { status, data, send, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true
})
```

⚠️ 使用 getRefreshToken() 而不是 getAccessToken()，因为 WebSocket 协议在连接后无法方便地进行令牌刷新。

## 2. WebSocket 消息结构

所有消息均为 JSON 格式，包含两个字段：

- type: 消息类型，用于区分业务动作

- content: 具体的业务数据内容

自 2025 年起，`content` 字段直接传入对象即可，**无需再使用 `JSON.stringify` 包裹**。

## 3. 前端可发送的消息

### 1. 连接指定传感器

```
{
  "type": "aiot-connect-sensor",
  "content": {
    "sensorId": 1
  }
}
```

### 2. 启动数据流采集

```
{
  "type": "aiot-start-stream-data",
  "content": {
    "recordType": 0,
    "recordMethod": 0,
    "timer": 0
  }
}
```

recordType 有三种 MANUAL(0), BEFORE(1), AFTER(2);

recordMethod 有两种 CUSTOM(0), TIMER(1);

### 3. 停止数据流采集

json

```
{
  "type": "aiot-stop-stream-data",
  "content": {}
}
```

### 4. 保存数据记录

```
{
  "type": "aiot-save-data",
  "content": {
    "machineLocationId": 1,
    "maintainer": "admin"
  }
}
```

## 4. 后端响应消息示例

### 操作成功响应

```
{
  "type": "aiot-start-stream-data-resp",
  "content": {
    "code": 1060000000,
    "msg": "成功"
  }
}
```

### 实时传感器数据响应

````{
  "type": "aiot-start-stream-data-resp",
  "content": {
    "timestamp": "102832415",
    "battery": 92,
    "rssi": -58,
    "temperature": 28.729767,
    "xaxisPeakToPeak": 51.728,
    "zaxisPeakToPeak": -39.04,
    "xaxisRms": 10.353751,
    "yaxisRms": 10.935942,
    "zaxisRms": 12.1793585,
    "yaxisPeakToPeak": 61.488,
    "yaxisMaRms": 9.989338,
    "xaxisMaRms": 10.632213,
    "zaxisMaRms": 1.2245935
  }
}```
## 5. 注意事项
- WebSocket 长连接建议配合心跳机制维持稳定性。

- 每次发送消息请确保连接状态为 OPEN。

- 后端返回的数据类型应通过 type 字段判断并做对应处理。

- 实时数据返回频率较高，应做好前端性能优化（如节流、图表缓存等）。

````
