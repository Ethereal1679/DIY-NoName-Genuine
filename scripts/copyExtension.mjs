// 将 packages/extension/<name> 原样同步到 apps/core/extension/<name>
// 供 legacy（免构建）扩展接入仓库的 build / build:watch 流程使用。
// 用法：在某个扩展目录下执行 `node ../../../scripts/copyExtension.mjs [--watch]`

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const src = process.cwd();
const name = path.basename(src);
const dest = path.join(ROOT, "apps", "core", "extension", name);

// 这些条目不参与输出（构建/包管理相关文件、压缩包等）
const EXCLUDE = new Set(["node_modules", "dist", "package.json", "pnpm-lock.yaml", "vite.config.ts", "vite.config.js", "tsconfig.json", ".git", ".gitignore"]);
const EXCLUDE_EXT = new Set([".zip", ".bak"]);

const filter = srcPath => {
	const base = path.basename(srcPath);
	return !EXCLUDE.has(base) && !EXCLUDE_EXT.has(path.extname(base).toLowerCase());
};

function writeInfoJson() {
	const infoPath = path.join(dest, "info.json");
	if (fs.existsSync(infoPath)) return;
	fs.writeFileSync(
		infoPath,
		JSON.stringify({ name, intro: "", author: "未知", diskURL: "", forumURL: "", version: "1.0" }, null, "\t")
	);
}

function sync(clean) {
	if (clean) fs.rmSync(dest, { recursive: true, force: true });
	fs.cpSync(src, dest, { recursive: true, filter });
	writeInfoJson();
	console.log(`[extension] ${name} -> ${path.relative(ROOT, dest)}`);
}

sync(true);

if (process.argv.includes("--watch")) {
	let timer = null;
	fs.watch(src, { recursive: true }, () => {
		clearTimeout(timer);
		timer = setTimeout(() => sync(false), 300);
	});
	console.log(`[extension] watching ${name} ...`);
}
