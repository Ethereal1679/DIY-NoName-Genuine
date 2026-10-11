import { defineConfig } from "vite";
import electron from "vite-plugin-electron";

export default defineConfig({
	resolve: {
		extensions: [".ts", ".mts", ".cts", ".js"],
	},
	server: {
		host: "127.0.0.1",
		port: 18765,
		strictPort: true,
		watch: {
			// Electron writes Chromium profile files here while the dev server is running.
			// Watching those transient files can fail on Windows with EBUSY.
			ignored: ["**/Home/**"],
		},
		proxy: {
			"/": {
				target: "http://127.0.0.1:18766",
				ws: true,
			},
		},
	},
	plugins: [
		electron([
			{
				entry: "app/main.ts",
				onstart({ startup }) {
					startup(["dist/app/main.js", "--no-sandbox"]);
				},
				vite: {
					build: {
						outDir: "dist/app/",
						minify: false,
						// rollupOptions: {
						// 	output: {
						// 		preserveModules: true,
						// 	},
						// },
					},
				},
			},
			{
				entry: "app/preload.ts",
				onstart({ reload }) {
					// Notify the Renderer process to reload the page when the Preload scripts build is complete,
					// instead of restarting the entire Electron App.
					reload();
				},
				vite: {
					build: {
						outDir: "dist/app/",
						// rollupOptions: {
						// 	output: {
						// 		preserveModules: true,
						// 	},
						// },
					},
				},
			},
		]),
	],
});
