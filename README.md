# transfer-webview-channel

一个轻量级的WebView与原生应用通信库。

## 安装

```bash
npm install transfer-webview-channel
```

## 特性

- 轻量级，无外部依赖
- 支持双向通信
- 支持超时处理
- 支持自定义数据解析
- Promise风格的API

## 使用方法

### 初始化

```javascript
import transfer from 'transfer-webview-channel';

// 定义数据传输实现方法
const transferImpl = (data) => {
    // 实现与原生端的通信
    window.webkit.messageHandlers.nativeHandler.postMessage(data);
};

// 初始化
await transfer.init(transferImpl);
```

### 发送消息

```javascript
// 基本使用
const result = await transfer.transferData({
    id: 'uniqueId',           // 必需，消息唯一标识
    actionType: 'getData',    // 可选，动作类型
    data: 'someData',         // 可选，传输的数据
    ext: 'extraInfo'          // 可选，额外信息
});

// 设置超时
const result = await transfer.transferData(
    {
        id: 'uniqueId',
        data: 'someData'
    },
    true,       // 是否等待响应
    5000        // 超时时间(ms)
);

// 不等待响应
await transfer.transferData(
    {
        id: 'uniqueId',
        data: 'someData'
    },
    false       // 不等待响应
);
```

### 自定义数据解析

```javascript
// 自定义数据解析方法
const customParser = (data) => {
    // 实现自定义解析逻辑
    return JSON.parse(data);
};

// 初始化时传入自定义解析方法
await transfer.init(transferImpl, customParser);
```

## API

### init(transferfun, parseDatafun)

初始化通信库。

- `transferfun`: (必需) 实现与原生端通信的方法
- `parseDatafun`: (可选) 自定义数据解析方法，默认使用 JSON.parse

### transferData(params, isAwait, maxTime)

发送数据并等待响应。

- `params`: (必需) 传输的数据对象
  - `id`: (必需) 消息唯一标识
  - `actionType`: (可选) 动作类型
  - `data`: (可选) 传输的数据
  - `ext`: (可选) 额外信息
- `isAwait`: (可选) 是否等待响应，默认为 true
- `maxTime`: (可选) 超时时间(ms)，默认为 3000ms，设为 -1 则永不超时


## 原生
请务必将原生端的实现与通信库进行匹配，最重要的是id的匹配，如果不返回id，那么通信库将无法识别响应。

## 许可证

ISC