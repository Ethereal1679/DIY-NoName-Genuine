import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import cors from "@fastify/cors";
import fs from "fs/promises";
import path from "path";
import { cwd } from "process";
import { exec } from "child_process";
import { networkInterfaces, type NetworkInterfaceInfo } from "node:os";

interface JsonResult<T = any> {
	success: boolean;
	code: number;
	errorMsg?: string;
	data?: T;
}

const successfulJson = <T = any>(data?: T): JsonResult<T> => ({
	success: true,
	code: 200,
	data,
});
const failedJson = <T = any>(code: number, message?: string): JsonResult<T> => ({
	success: false,
	code,
	errorMsg: message,
});

export const defaultConfig = {
	server: false,
	port: 8089,
	debug: false,
	dirname: cwd(),
};

export interface HostNetworkInterface {
	name: string;
	address: string;
	internal: boolean;
	type: "lan" | "zerotier" | "virtual";
}

export interface HostNetworkAddresses {
	interfaces: HostNetworkInterface[];
	lan: string[];
	zerotier: string[];
}

const virtualInterfacePattern = /zerotier|vmware|virtualbox|vethernet|hyper-v|wsl|docker|tailscale/i;

function isPrivateIPv4(address: string) {
	const parts = address.split(".").map(Number);
	if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
	return parts[0] === 10 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

/**
 * Convert Node's platform-specific adapter data into the small, safe shape
 * consumed by the multiplayer lobby. MAC addresses are deliberately omitted.
 */
export function collectHostNetworkAddresses(adapters = networkInterfaces()): HostNetworkAddresses {
	const found: HostNetworkInterface[] = [];

	for (const [name, entries] of Object.entries(adapters)) {
		for (const entry of entries || []) {
			const info = entry as NetworkInterfaceInfo;
			const family = info.family as string | number;
			if ((family !== "IPv4" && family !== 4) || info.internal) continue;
			if (info.address === "127.0.0.1" || info.address.startsWith("169.254.")) continue;

			const type = /zerotier/i.test(name) ? "zerotier" : virtualInterfacePattern.test(name) ? "virtual" : "lan";
			found.push({ name, address: info.address, internal: false, type });
		}
	}

	const unique = (addresses: string[]) => [...new Set(addresses)];
	const lan = unique(
		found
			.filter(item => item.type === "lan")
			.sort((a, b) => Number(isPrivateIPv4(b.address)) - Number(isPrivateIPv4(a.address)) || a.name.localeCompare(b.name))
			.map(item => item.address)
	);
	const zerotier = unique(found.filter(item => item.type === "zerotier").map(item => item.address));

	return { interfaces: found, lan, zerotier };
}

function createFsHandler(dirname: string) {
	const join = (url: string) => path.join(dirname, url);
	const isInProject = (url: string) => path.normalize(join(url)).startsWith(dirname);

	const ensureSafe = (url: string) => {
		if (!isInProject(url)) throw new Error(`只能访问 ${dirname} 下的资源`);
		return join(url);
	};

	const wrap = <Q, R>(fn: (query: Q) => Promise<R>) => {
		return async (req: any) => {
			try {
				return successfulJson(await fn(req.method == "POST" ? req.body : req.query));
			} catch (e: any) {
				return failedJson(400, String(e));
			}
		};
	};

	return { join, ensureSafe, wrap };
}

export default function createApp(config: Partial<typeof defaultConfig> = {}) {
	const cfg = { ...defaultConfig, ...config };
	cfg.dirname = path.resolve(cfg.dirname);
	if (cfg.debug) console.log(cfg);
	const app = Fastify({
		logger: cfg.debug,
	});

	const { ensureSafe, wrap } = createFsHandler(cfg.dirname);

	app.register(cors, {
		origin: "*",
		methods: ["GET", "POST", "OPTIONS"],
	});

	app.register(fastifyStatic, {
		root: cfg.dirname,
		prefix: "/",
		dotfiles: "allow",
		maxAge: 0,
	});

	// index.html
	app.get("/", async (req, reply) => reply.redirect("/index.html"));

	app.get(
		"/networkInterfaces",
		wrap(async () => collectHostNetworkAddresses())
	);

	app.get(
		"/createDir",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			await fs.mkdir(full, { recursive: true });
			return true;
		})
	);

	app.get(
		"/removeDir",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			const stat = await fs.stat(full);
			if (!stat.isDirectory()) throw new Error(`${full} 不是文件夹`);
			await fs.rm(full, { recursive: true, force: true });
			return true;
		})
	);

	app.get(
		"/readFile",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			const data = await fs.readFile(full);
			return [...new Uint8Array(data)];
		})
	);

	app.get(
		"/readFileAsText",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			return await fs.readFile(full, "utf-8");
		})
	);

	app.post(
		"/writeFile",
		{
			bodyLimit: 10 * 1024 * 1024 * 1024,
		},
		wrap(async ({ path: p, data }: { path: string; data: number[] }) => {
			const full = ensureSafe(p);
			await fs.mkdir(path.dirname(full), { recursive: true });
			await fs.writeFile(full, Buffer.from(data));
			return true;
		})
	);

	app.get(
		"/removeFile",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			const stat = await fs.stat(full);
			if (stat.isDirectory()) throw new Error("不能删除文件夹");
			await fs.unlink(full);
			return true;
		})
	);

	app.get(
		"/getFileList",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			const stat = await fs.stat(full);
			if (stat.isFile()) throw new Error("路径不是文件夹");

			const entries = await fs.readdir(full);
			const files: string[] = [];
			const folders: string[] = [];

			await Promise.all(
				entries.map(async entry => {
					if (entry.startsWith(".") || entry.startsWith("_")) return;
					const s = await fs.stat(path.join(full, entry));
					s.isDirectory() ? folders.push(entry) : files.push(entry);
				})
			);

			return { folders, files };
		})
	);

	app.get(
		"/checkFile",
		wrap(async ({ fileName }: { fileName: string }) => {
			const full = ensureSafe(fileName);
			try {
				const stat = await fs.stat(full);
				if (stat.isFile()) return "file";
				else return "directory";
			} catch {
				return {};
			}
		})
	);

	app.get(
		"/checkDir",
		wrap(async ({ dir }: { dir: string }) => {
			const full = ensureSafe(dir);
			try {
				const stat = await fs.stat(full);
				if (stat.isFile()) return "file";
				else return "directory";
			} catch {
				return {};
			}
		})
	);

	app.setNotFoundHandler((req, reply) => {
		reply.code(404).send("Sorry can't find that!");
	});

	app.setErrorHandler((err, req, reply) => {
		reply.send(failedJson(400, String(err)));
	});

	const callback = () => {
		console.log(`Server listening on port ${cfg.port}`);
		if (!cfg.server && !cfg.debug) exec(`start http://localhost:${cfg.port}/`);
	};

	// if (config.https) {
	// 	const SSLOptions = {
	// 		key: fs.readFileSync(path.join(config.dirname, "localhost.decrypted.key")),
	// 		cert: fs.readFileSync(path.join(config.dirname, "localhost.crt")),
	// 	};
	// 	const httpsServer = https.createServer(SSLOptions, app);
	// 	// 会提示NET::ERR_CERT_AUTHORITY_INVALID
	// 	// 但浏览器还是可以访问的
	// 	// todo: 解决sw注册问题
	// 	httpsServer.listen(config.port, callback);
	// } else {
	// 	app.listen(config.port, callback);
	// }
	app.listen({ port: cfg.port }, callback);

	return app;
}
