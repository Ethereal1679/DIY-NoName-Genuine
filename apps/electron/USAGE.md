• apps/electron 是这个项目的“桌面客户端外壳”，作用是把核心游戏包装成 Windows/macOS/Linux 可运行的独立应用。

  主要职责：

  - app/main.ts：Electron 主进程
      - 创建游戏窗口
      - 启动本地文件/HTTP 服务（端口 18767）
      - 配置用户数据、缓存、日志和崩溃文件目录
      - 提供菜单、全屏、开发者工具等桌面功能
      - 确保只能启动一个实例

  - app/preload.ts：预加载脚本
      - 配置窗口菜单栏和全屏行为
      - 在页面和 Electron API 之间提供桥接

  - vite.config.ts：开发和构建配置
      - 编译主进程、预加载脚本
      - 开发时连接核心游戏服务

  - build.ts：发行版打包
      - 使用 electron-builder
      - 生成 Windows 安装包、Linux AppImage、macOS DMG

  启动关系大致是：

  apps/core       核心游戏代码
  packages/fs     本地文件/HTTP 服务
  apps/electron   桌面窗口和系统集成

  所以，apps/electron 本身不是游戏逻辑，而是让游戏能够以桌面程序形式运行和发布。网页模式可以直接运行核心项目；Electron 模式则通过它提供独立窗口、文件访问和安
  装包。