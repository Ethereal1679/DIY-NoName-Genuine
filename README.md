# 无名杀-联机版 + UI美化
codebase来自：https://github.com/libnoname/noname 始终最新，社区依然在维护这个项目。因此放弃原来的codebase，转用新的codebase。
美化插件来自：https://github.com/lieren2023/noname-for-dummies/tree/main/extension

# 配置
先默认使用windows，后续再开发移动端和linux的兼容。

# 安装
```shell
pnpm install
```

# 启动
```shell
pnpm dev
```

# 写在后面
笔者也尝试在其他版本（比如https://github.com/lieren2023/noname-for-dummies）上进行修改，但是碍于该项目近些年作者没有维护，导致仍使用一些旧版本的兼容模式，导致新版本的手杀等
武将没办法很容易的兼容进去（但是该版本的美化等都预先处理好了，而且效果不错），所以我最终选择使用这个仍在维护的无名杀官方版本分别添加：
- 联机功能：支持局域网联机以及公网联机
- UI美化：移植手杀和十周年UI扩展，将这个版本的页面进行美化
- 修改bug：修改兼容过程中的一些bug，并为开发者留有接口进行DIY测试

>笔者是搞机器人的，因此希望这个项目也能成为一个像liao佬BeyondMimic那样的perfect base！