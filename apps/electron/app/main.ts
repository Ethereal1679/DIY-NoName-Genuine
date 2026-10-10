/// <reference types="vite/client" />
import { app, BrowserWindow, crashReporter, dialog, Menu, shell } from "electron";
import fs from "fs";
import path from "path";
import remote from "@electron/remote/main/index.js";
import createApp from "@noname/fs";
remote.initialize();
const dirname = path.join(import.meta.dirname, "../");
createApp({
	port: 18767,
	dirname,
	server: true,
});

// 获取单实例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
	// 如果获取失败，说明已经有实例在运行了，直接退出
	app.quit();
}

app.setAppUserModelId("com.libnoname.noname");

//防止32位无名杀的乱码
app.setName("无名杀");

function setPath(path1: any, path2: any) {
	app.getPath(path1);
	fs.mkdirSync(path2, { recursive: true });
	app.setPath(path1, path2);
}

//数据目录不能放在 dist 下：vite build 会清空 dist，导致 localStorage/IndexedDB 里的用户配置被重置
//开发模式放在 apps/electron/Home（dist 之外）；打包后使用系统默认用户数据目录（可写）
const dataRoot = app.isPackaged ? app.getPath("userData") : path.join(import.meta.dirname, "../../Home");

setPath("home", dataRoot);
setPath("appData", path.join(dataRoot, "AppData"));
setPath("userData", path.join(dataRoot, "UserData"));
setPath("temp", path.join(dataRoot, "Temp"));
setPath("cache", path.join(dataRoot, "Cache"));
//崩溃转储文件存储的目录
setPath("crashDumps", path.join(dataRoot, "crashDumps"));
//日志目录
setPath("logs", path.join(dataRoot, "logs"));

//崩溃处理
crashReporter.start({
	productName: "无名杀",
	//崩溃报告将被收集并存储在崩溃目录中，不会上传
	uploadToServer: false,
	compress: false,
});

// 其他实例启动时，主实例会通过 second-instance 事件接收其他实例的启动参数 `argv`
app.on("second-instance", (event, argv) => {
	// Windows 下通过协议URL启动时，URL会作为参数，所以需要在这个事件里处理
	if (process.platform === "win32") {
		createWindow();
	}
});

// macOS 下通过协议URL启动时，主实例会通过 open-url 事件接收这个 URL
app.on("open-url", (event, urlStr) => {
	createWindow();
});

app.setAboutPanelOptions({
	iconPath: "noname.ico",
	website: "https://github.com/libnoname/noname",
});

process.env["ELECTRON_DEFAULT_ERROR_MODE"] = "true";
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
process.noDeprecation = true;

function createWindow() {
	createMainWindow();
}

function createMainWindow() {
	let win = new BrowserWindow({
		width: 1000,
		height: 800,
		title: "无名杀",
		icon: path.join(dirname, "noname.ico"),
		webPreferences: {
			webSecurity: false,
			preload: path.join(dirname, "app/preload.js"),
			nodeIntegration: true, //主页面用node
			nodeIntegrationInSubFrames: true, //子页面用node
			nodeIntegrationInWorker: true, //worker用node
			contextIsolation: false, //必须为false
			plugins: true, //启用插件
			// @ts-ignore
			enableRemoteModule: true, //可以调用Remote
			experimentalFeatures: true, //启用Chromium的实验功能
		},
	});
	if (import.meta.env.DEV) {
		win.loadURL(`http://127.0.0.1:18765`);
	} else {
		win.loadURL(`http://localhost:18767/index.html`);
	}
	remote.enable(win.webContents);
	const menuTemplate: Electron.MenuItemConstructorOptions[] = [
		{
			label: "操作",
			submenu: [
				{
					label: "打开无名杀目录",
					click: () => {
						shell.showItemInFolder(path.join(app.getAppPath(), "app"));
					},
				},
			],
		},
		{
			label: "窗口",
			submenu: [
				{
					label: "重新加载当前窗口",
					role: "reload",
				},
				{
					label: "打开/关闭控制台",
					role: "toggleDevTools",
				},
				{
					type: "separator",
				},
				{
					label: "全屏模式",
					role: "togglefullscreen",
				},
				{
					label: "最小化",
					role: "minimize",
				},
				{
					type: "separator",
				},
			],
		},
		{
			label: "帮助",
			submenu: [
				{
					label: "bug反馈",
					click: () => {
						shell.openExternal("https://tieba.baidu.com/p/9117747182");
					},
				},
				{
					label: "版权声明",
					click: () => {
						dialog.showMessageBoxSync(win, {
							message:
								"【无名杀】属于个人（水乎）开发项目且【完全免费】。如非法倒卖用于牟利将承担法律责任 开发团队将追究到底",
							type: "info",
							title: "版权声明",
							icon: path.join(app.getAppPath(), "app", "noname.ico"),
						});
					},
				},
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
	return win;
}

app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
