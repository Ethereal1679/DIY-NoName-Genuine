# 无名杀-联机版 + UI美化
codebase来自：https://github.com/libnoname/noname 始终最新，社区依然在维护这个项目。因此放弃原来的codebase，转用新的codebase。

UI美化插件来自：https://github.com/lieren2023/noname-for-dummies/tree/main/extension 中的棘手魔改版extension

> 感谢佬们的开源！，Orz Orz Orz Orz Orz Orz

# 配置
默认使用windows，后续再开发移动端和linux的兼容。默认使用chrome内核浏览器

# 安装&启动
默认已经安装了npm相关依赖（参考[源码](https://github.com/libnoname/noname)）

安装
```shell
npm install --global pnpm
pnpm install
```

启动后台运行
```shell
pnpm dev
```

这时自动跳转浏览器，也可以手动浏览器输入:`http://127.0.0.1:8084/`进入游戏,默认使用`8084`端口进行本地可视化显示，使用`8082`端口进行服务器联机

如果更改了一些代码导致没有生效的话，使用快捷键重制浏览器：
```
ctrl + shift + r
```

# 写在后面
笔者也尝试在其他版本（比如`https://github.com/lieren2023/noname-for-dummies`）上进行修改，但是碍于该项目近些年作者没有维护，导致仍使用一些旧版本的兼容模式，导致新版本的手杀等
武将没办法很容易的兼容进去（但是该版本的美化等都预先处理好了，而且效果不错），所以我最终选择使用这个仍在维护的无名杀官方版本分别添加：
- 联机功能：支持局域网联机以及公网联机
- UI美化：移植手杀和十周年UI扩展，将这个版本的页面进行美化
- 修改bug：修改兼容过程中的一些bug，并为开发者留有接口进行DIY测试


>笔者是搞机器人的，因此希望这个项目也能成为一个像liao佬`BeyondMimic`那样的perfect base！