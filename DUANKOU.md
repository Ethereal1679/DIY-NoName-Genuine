# Noname 端口说明

当前开发环境使用以下端口：

```text
18765  Electron/Vite 开发中间层，窗口加载此地址
18766  核心游戏 Vite 开发页面，Web 模式实际打开的页面
18767  @noname/fs 文件/API 服务，负责文件读写、网卡扫描及生产 Electron 页面
8082   独立联机 WebSocket 服务（保持不变，避免影响现有联机协议）
```

启动链路：

```text
一键启动 Electron
  Electron 窗口
      -> 18765 Electron/Vite
          -> 18766 游戏页面 Vite
              -> 18767 文件/API 服务

Web 开发模式
  浏览器 -> 18766 游戏页面
               -> 18767 文件/API 服务

联机服务
  游戏客户端 -> ws://服务器:8082
```

## 启动日志说明

`Port 8080 is already in use` 是旧版 Electron/Vite 端口占用提示。当前配置已改为 `18765`，正常启动时不应再绑定 `8080`。

`ECONNREFUSED 127.0.0.1:8089` 表示页面仍访问旧的文件/API 服务端口，或文件/API 服务没有启动。当前正确端口为 `18767`。核心 Vite 代理、Electron 主进程、文件服务默认配置和联机模式的网卡扫描回退地址均已同步到 `18767`。

`@electron/remote` 或 `electron` 的依赖解析警告属于 Electron 专用模块被核心 Vite 扫描时的独立问题，不是端口占用直接造成的，需要单独检查依赖和 Vite 配置。
