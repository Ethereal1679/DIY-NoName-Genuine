# 1. 无名杀-联机版 + UI美化
**动机**：笔者最近看到有人使用GPT 6 ASTRA制作了可联机版我的世界，因此心血来潮想做一个联机的三国杀，看到从前佬们其实已经实现了，但是总是缺少一个手杀UI，且联机效果较好的版本（其实只是自己并不是很和自己的胃口hhh），因此借助AI工具（我用的API中转站版的gpt-5.6-sol xhigh），我搞了下面这个小项目，斟酌游玩，里面还是有不少的bug，可以在issue中交流，也可以提PR，不喜轻喷！

codebase来自：https://github.com/libnoname/noname 始终最新，社区依然在维护这个项目。因此放弃原来的codebase，转用新的`codebase`。

UI美化插件来自：https://github.com/lieren2023/noname-for-dummies/tree/main/extension 中的棘手魔改版`extension`。

> 感谢佬们的开源！，Orz Orz Orz Orz Orz Orz

# 2. 设备配置
默认`windows`，后续再开发移动端和linux的兼容。默认使用chrome内核浏览器


# 3.1. 从源码安装和启动
默认已经安装了`npm`相关依赖（参考[codebase](https://github.com/libnoname/noname)）

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

如果更改了一些代码导致没有生效的话，使用`快捷键`刷新浏览器：
```
ctrl + shift + r
```

# 3.2. 从懒人安装和启动

双击`一键启动.bat`，一键检测当前安装环境，一键安装。下面是成功一键启动的cli：

![成功启动](readme_images\success_cli_image.png)

双击`一键清理旧占用进程.bat`，一键清理过去重复启动导致的端口以及进程占用的问题，非必要可以不使用，仅作调试。

# 4.1. 局域网联机
局域网联机在联机配置的时候，输入主机的IP地址即可，默认端口:`8082`

![Device Guide](readme_images\connect_image.png)



# 4.2. 非局域网联机

使用ZeroTier进行内网穿透,尝试非局域网进行联机

安装zerotier msi网址：https://www.zerotier.com/, 当前目录下ZeroTier文件夹也有安装包。

下面的链接是zerotier的链接：https://central.zerotier.com/network/b103a835d2cef2b6

## 4.2.1. 主机
主机添加其他人设备的`device id`：

![Device Guide](readme_images\device_add_guide.png)


## 4.2.2. 其他人的设备
安装zerotier后可见下面的这些参数：
添加主机的`network id`：

![Other Device](readme_images\other_devices.jpg)

# 5. demo

![Other Device](readme_images\demo_image1.png)

# 6. 写在后面
笔者也尝试在其他版本（比如`https://github.com/lieren2023/noname-for-dummies`）上进行修改，但是碍于该项目近些年作者没有维护，导致仍使用一些旧版本的兼容模式，导致新版本的手杀等
武将没办法很容易的兼容进去（但是该版本的美化等都预先处理好了，而且效果不错），所以我最终选择使用这个仍在维护的无名杀官方版本分别添加：
- 联机功能：支持局域网联机以及公网联机
- UI美化：移植手杀和十周年UI扩展，将这个版本的页面进行美化
- 修改bug：修改兼容过程中的一些bug，并为开发者留有接口进行DIY测试


>笔者是搞机器人的，因此希望这个项目也能成为一个像liao佬`BeyondMimic`那样的perfect base！