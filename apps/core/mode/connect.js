import { lib, game, ui, get, _status } from "noname";

export const type = "mode";

/**
 * The connect mode owns the first-run lobby shown before the regular online
 * room list is created. It works in the browser, Electron and mobile shell.
 */
export default () => {
	return {
		name: "connect",
		start() {
			const directstartmode = lib.config.directstartmode;
			ui.create.menu(true);
			const state = { created: false, connecting: false };
			const hostAddresses = { lan: [], zerotier: [] };
			const notDetected = "未检测到";
			const virtualInterfacePattern = /zerotier|vmware|virtualbox|vethernet|hyper-v|wsl|docker|tailscale/i;

			const isIPv4 = address => {
				const parts = String(address || "")
					.split(".")
					.map(Number);
				return parts.length === 4 && parts.every(part => Number.isInteger(part) && part >= 0 && part <= 255);
			};

			const isPrivateIPv4 = address => {
				const parts = address.split(".").map(Number);
				return parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
			};

			const normalizeAddressList = addresses =>
				[...new Set((Array.isArray(addresses) ? addresses : []).filter(isIPv4))].filter(address => address !== "127.0.0.1" && !address.startsWith("169.254."));

			const collectNetworkAddresses = interfaces => {
				const lan = [];
				const zerotier = [];
				for (const [name, entries] of Object.entries(interfaces || {})) {
					for (const entry of entries || []) {
						if ((entry.family !== "IPv4" && entry.family !== 4) || entry.internal || !isIPv4(entry.address)) continue;
						if (entry.address === "127.0.0.1" || entry.address.startsWith("169.254.")) continue;
						if (/zerotier/i.test(name)) zerotier.push(entry.address);
						else if (!virtualInterfacePattern.test(name)) lan.push(entry.address);
					}
				}
				lan.sort((a, b) => Number(isPrivateIPv4(b)) - Number(isPrivateIPv4(a)));
				return { lan: normalizeAddressList(lan), zerotier: normalizeAddressList(zerotier) };
			};

			const normalizeNetworkResponse = payload => {
				if (payload?.success === false) throw new Error(payload.errorMsg || "主机网卡扫描失败");
				const data = payload?.success === true ? payload.data : payload;
				return {
					lan: normalizeAddressList(data?.lan),
					zerotier: normalizeAddressList(data?.zerotier),
				};
			};

			const networkScanURLs = () => {
				const urls = [];
				try {
					urls.push(new URL("/networkInterfaces", window.location.href).href);
				} catch {
					// The fallback below also covers file:// pages.
				}
				if (window.location.protocol === "http:") {
					const fallback = new URL(window.location.href);
					fallback.port = "18767";
					fallback.pathname = "/networkInterfaces";
					fallback.search = "";
					fallback.hash = "";
					urls.push(fallback.href);
				} else if (window.location.protocol === "file:") {
					urls.push("http://127.0.0.1:18767/networkInterfaces");
				}
				return [...new Set(urls)];
			};

			const fetchNetworkAddresses = async () => {
				let lastError;
				for (const url of networkScanURLs()) {
					const controller = typeof AbortController === "function" ? new AbortController() : null;
					const timeout = controller ? setTimeout(() => controller.abort(), 2500) : null;
					try {
						const response = await fetch(url, { cache: "no-store", signal: controller?.signal });
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						return normalizeNetworkResponse(await response.json());
					} catch (error) {
						lastError = error;
					} finally {
						if (timeout) clearTimeout(timeout);
					}
				}
				throw lastError || new Error("没有可用的主机网卡扫描服务");
			};

			const preferredHostAddress = () => hostAddresses.lan[0] || hostAddresses.zerotier[0] || window.location.hostname || "127.0.0.1";

			const localEndpoint = () => {
				return `${preferredHostAddress()}:8082`;
			};

			const normalizeEndpoint = value => {
				let address = String(value || "").trim();
				if (!address) return "";
				if (address.startsWith("http://") || address.startsWith("https://")) {
					try {
						const url = new URL(address);
						const secure = url.protocol === "https:";
						url.protocol = secure ? "wss:" : "ws:";
						if (!url.port) url.port = /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || url.hostname === "localhost" ? "8082" : "8080";
						return url.href;
					} catch {
						return address;
					}
				}
				if (address.startsWith("ws://") || address.startsWith("wss://")) {
					try {
						const url = new URL(address);
						if (!url.port && url.protocol === "ws:" && (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) || url.hostname === "localhost")) {
							url.port = "8082";
						}
						return url.href;
					} catch {
						return address;
					}
				}

				// The standalone LAN server listens on 8082. Explicit ports and
				// IPv6 literals are left untouched for public server links.
				if (address.startsWith("[")) return address.includes("]:") ? address : `${address}:8082`;
				if (/^[0-9a-f:]+$/i.test(address) && address.includes(":")) return `[${address}]:8082`;
				if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address) || address === "localhost") return `${address}:8082`;
				return address;
			};

			const createElement = (tag, className, text, parent) => {
				const element = document.createElement(tag);
				if (className) element.className = className;
				if (text !== undefined) element.textContent = text;
				if (parent) parent.appendChild(element);
				return element;
			};

			const createNode = () => {
				if (state.created && ui.connectOverlay?.isConnected) return;
				state.created = false;
				state.connecting = false;

				if (directstartmode && lib.node) {
					ui.exitroom = ui.create.system("退出房间", function () {
						game.saveConfig("directstartmode");
						game.reload();
					}, true);
					game.switchMode(directstartmode);
					return;
				}

				if (lib.node && window.require && !ui.startServer) {
					ui.startServer = ui.create.system("启动服务器", function (e) {
						ui.click.shortcut(false);
						e.stopPropagation();
						ui.click.connectMenu();
					}, true);
				}

				state.created = true;
				const overlay = createElement("section", "lan-connect-overlay", undefined, ui.window);
				overlay.setAttribute("aria-label", "联机大厅");
				overlay.addEventListener("click", event => event.stopPropagation());

				const panel = createElement("div", "lan-connect-panel", undefined, overlay);
				const header = createElement("div", "lan-connect-header", undefined, panel);
				const titleGroup = createElement("div", "lan-connect-title-group", undefined, header);
				createElement("div", "lan-connect-kicker", "MULTIPLAYER", titleGroup);
				createElement("h1", "lan-connect-title", "联机大厅", titleGroup);
				const refresh = createElement("button", "lan-connect-icon-button", "↻", header);
				refresh.type = "button";
				refresh.title = "重新扫描本机 IPv4 地址";
				refresh.setAttribute("aria-label", "重新扫描本机 IPv4 地址");

				const tabs = createElement("div", "lan-connect-tabs", undefined, panel);
				const lanTab = createElement("button", "lan-connect-tab active", "局域网联机", tabs);
				const serverTab = createElement("button", "lan-connect-tab", "服务器联机", tabs);
				lanTab.type = serverTab.type = "button";
				serverTab.addEventListener("click", () => {
					lanTab.classList.remove("active");
					serverTab.classList.add("active");
					setStatus("支持 ws / wss 地址，也可粘贴邀请链接", "ready");
				});
				lanTab.addEventListener("click", () => {
					serverTab.classList.remove("active");
					lanTab.classList.add("active");
					setStatus("同一局域网内请使用主机的 IPv4 地址", "ready");
				});

				const form = createElement("form", "lan-connect-form", undefined, panel);
				const label = createElement("label", "lan-connect-label", "输入联机地址", form);
				const input = createElement("input", "lan-connect-input", undefined, form);
				input.type = "text";
				input.autocomplete = "url";
				input.spellcheck = false;
				input.placeholder = "例如 192.168.1.20:8082";
				input.setAttribute("aria-label", "联机地址");
				label.htmlFor = input.id = `connect-address-${Date.now()}`;

				const actions = createElement("div", "lan-connect-actions", undefined, form);
				const connectButton = createElement("button", "lan-connect-primary", "连接", actions);
				connectButton.type = "submit";
				const localButton = createElement("button", "lan-connect-secondary", "填入本机", actions);
				localButton.type = "button";

				const status = createElement("div", "lan-connect-status", undefined, panel);
				const statusDot = createElement("span", "lan-connect-status-dot", undefined, status);
				const statusText = createElement("span", "lan-connect-status-text", "等待连接", status);

				const info = createElement("div", "lan-connect-info", undefined, panel);
				const infoHeader = createElement("div", "lan-connect-info-header", undefined, info);
				createElement("span", "lan-connect-info-title", "联机主机信息", infoHeader);
				const copy = createElement("button", "lan-connect-copy", "复制", infoHeader);
				copy.type = "button";
				const rows = createElement("div", "lan-connect-info-rows", undefined, info);
				const addRow = (name, value) => {
					const row = createElement("div", "lan-connect-info-row", undefined, rows);
					createElement("span", "lan-connect-info-name", name, row);
					return createElement("code", "lan-connect-info-value", value, row);
				};
				const lanAddressNode = addRow("局域网 IPv4", notDetected);
				const zerotierAddressNode = addRow("ZeroTier IPv4", notDetected);
				addRow("网页地址", window.location.host || "本地文件");
				const endpointNode = addRow("联机地址", normalizeEndpoint(input.value));
				addRow("连接方式", "WebSocket / 局域网");

				const recent = createElement("div", "lan-connect-recent", undefined, panel);
				createElement("span", "lan-connect-recent-label", "最近连接", recent);
				const recentSelect = createElement("select", "lan-connect-recent-select", undefined, recent);
				recentSelect.setAttribute("aria-label", "最近连接");
				const recentIPs = Array.isArray(lib.config.recentIP) ? lib.config.recentIP : [];
				if (!recentIPs.length) {
					const option = createElement("option", "", "暂无记录", recentSelect);
					option.disabled = true;
				} else {
					for (const recentIP of recentIPs) {
						const option = createElement("option", "", get.trimip(recentIP), recentSelect);
						option.value = recentIP;
					}
				}
				const useRecent = createElement("button", "lan-connect-recent-use", "使用", recent);
				useRecent.type = "button";
				useRecent.addEventListener("click", () => {
					if (recentSelect.value) {
						input.value = recentSelect.value;
						updateInfo();
						input.focus();
					}
				});

				const setStatus = (message, kind = "ready") => {
					statusText.textContent = message;
					status.dataset.state = kind;
					statusDot.dataset.state = kind;
				};
				const updateInfo = () => {
					endpointNode.textContent = normalizeEndpoint(input.value) || localEndpoint();
				};
				const renderHostAddresses = () => {
					lanAddressNode.textContent = hostAddresses.lan.join(" / ") || notDetected;
					zerotierAddressNode.textContent = hostAddresses.zerotier.join(" / ") || notDetected;
				};
				const isLoopbackEndpoint = value => /^(?:(?:ws|wss|http|https):\/\/)?(?:127\.0\.0\.1|localhost)(?::\d+)?\/?$/i.test(String(value || "").trim());
				let scanId = 0;
				const scanHostAddresses = async ({ fillInput = false, replaceLoopback = false } = {}) => {
					const currentScan = ++scanId;
					refresh.disabled = true;
					refresh.classList.add("scanning");
					setStatus("正在扫描主机网卡…", "busy");
					let detected = null;
					try {
						if (lib.node && window.require) {
							try {
								detected = collectNetworkAddresses(window.require("os").networkInterfaces());
							} catch {
								// Fall through to the local HTTP service.
							}
						}
						if (!detected) detected = await fetchNetworkAddresses();
						if (currentScan !== scanId) return;
						hostAddresses.lan = detected.lan;
						hostAddresses.zerotier = detected.zerotier;
						renderHostAddresses();

						if (fillInput || (replaceLoopback && isLoopbackEndpoint(input.value))) {
							input.value = localEndpoint();
							updateInfo();
						}

						if (hostAddresses.lan.length && hostAddresses.zerotier.length) setStatus("已检测到局域网和 ZeroTier IPv4 地址", "success");
						else if (hostAddresses.lan.length) setStatus("已检测到本机局域网 IPv4 地址", "success");
						else if (hostAddresses.zerotier.length) setStatus("已检测到本机 ZeroTier IPv4 地址", "success");
						else setStatus("未检测到可用的局域网或 ZeroTier IPv4 地址", "error");
					} catch (error) {
						if (currentScan !== scanId) return;
						console.warn("无法扫描主机 IPv4 地址:", error);
						renderHostAddresses();
						setStatus("无法读取主机网卡，请确认本地文件服务已启动", "error");
					} finally {
						if (currentScan === scanId) {
							refresh.disabled = false;
							refresh.classList.remove("scanning");
						}
					}
				};
				const fillPreferredAddress = async () => {
					if (!hostAddresses.lan.length && !hostAddresses.zerotier.length) await scanHostAddresses();
					input.value = localEndpoint();
					updateInfo();
					input.focus();
				};
				refresh.addEventListener("click", () => scanHostAddresses({ fillInput: true }));
				localButton.addEventListener("click", fillPreferredAddress);
				for (const [node, addressType] of [
					[lanAddressNode, "lan"],
					[zerotierAddressNode, "zerotier"],
				]) {
					node.title = "点击填入此地址";
					node.classList.add("selectable");
					node.addEventListener("click", () => {
						const addresses = hostAddresses[addressType];
						if (!addresses.length) return;
						input.value = normalizeEndpoint(addresses[0]);
						updateInfo();
						input.focus();
					});
				}

				const connect = event => {
					event?.preventDefault();
					if (state.connecting) return;
					const ip = normalizeEndpoint(input.value);
					if (!ip) {
						setStatus("请输入有效的联机地址", "error");
						input.focus();
						return;
					}
					state.connecting = true;
					connectButton.disabled = true;
					input.value = ip;
					updateInfo();
					setStatus("正在连接服务器…", "busy");
					game.requireSandboxOn(ip);
					game.saveConfig("last_ip", ip);
					game.connect(ip, success => {
						state.connecting = false;
						connectButton.disabled = false;
						if (success) {
							setStatus("连接成功，正在进入大厅…", "success");
							const reconnect = lib.config.reconnect_info;
							if (reconnect && reconnect[0] == _status.ip) {
								game.onlineID = reconnect[1];
								if (typeof (game.roomId = reconnect[2]) == "string") game.roomIdServer = true;
							}
							return;
						}
						setStatus("连接失败，请检查地址和防火墙", "error");
					});
				};
				form.addEventListener("submit", connect);
				input.addEventListener("input", updateInfo);
				copy.addEventListener("click", () => {
					const value = endpointNode.textContent;
					const done = () => {
						copy.textContent = "已复制";
						setTimeout(() => (copy.textContent = "复制"), 1200);
					};
					if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done).catch(() => {});
				});

				const lastIP = lib.config.last_ip || localEndpoint();
				input.value = normalizeEndpoint(lastIP);
				updateInfo();
				scanHostAddresses({ replaceLoopback: true });

				ui.ipnode = input;
				ui.iptext = statusText;
				ui.ipbutton = connectButton;
				ui.connectOverlay = overlay;

				ui.hall_button = ui.create.system("联机大厅", function () {
					input.value = get.config("hall_ip") || lib.hallURL;
					connect();
				}, true);
				if (!get.config("hall_button")) ui.hall_button.style.display = "none";
				ui.recentIP = ui.create.system("最近连接", null, true);

				if (get.config("read_clipboard", "connect")) {
					const readInvite = text => {
						const match = String(text || "").match(/联机地址\s*[:：]\s*(\S+)/);
						if (!match || !match[1]) return;
						if (!confirm("是否根据剪贴板的邀请链接进入联机房间？")) return;
						input.value = match[1];
						_status.read_clipboard_text = text;
						connect();
					};
					if (navigator.clipboard && lib.node) navigator.clipboard.readText().then(readInvite).catch(() => {});
				}
				lib.init.onfree();
			};

			createNode();
			if (!game.onlineKey) {
				game.onlineKey = localStorage.getItem(lib.configprefix + "key");
				if (!game.onlineKey) {
					game.onlineKey = get.id();
					localStorage.setItem(lib.configprefix + "key", game.onlineKey);
				}
			}
			const reconnect = lib.config.reconnect_info;
			const pendingRoom = lib.config.tmp_owner_roomId || lib.config.tmp_user_roomId || reconnect?.[2];
			if (!game.online && pendingRoom && reconnect?.[0]) {
				ui.ipnode.value = normalizeEndpoint(reconnect[0]);
				ui.ipnode.dispatchEvent(new Event("input"));
				setTimeout(() => ui.ipbutton?.click(), 0);
			}
			_status.connectDenied = createNode;
			setTimeout(lib.init.onfree, 1000);
		},
	};
};
