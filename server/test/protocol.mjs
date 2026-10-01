import assert from "node:assert/strict";
import { WebSocket } from "ws";

import { createServer } from "../dist/index.js";

const port = 20000 + Math.floor(Math.random() * 10000);
const url = "ws://127.0.0.1:" + port;

function createClient() {
	const socket = new WebSocket(url);
	const queue = [];
	const waiters = [];

	socket.on("message", data => {
		const raw = data.toString();
		if (raw === "heartbeat") {
			socket.send("heartbeat");
			return;
		}

		let message;
		try {
			message = JSON.parse(raw);
		} catch {
			message = raw;
		}

		const index = waiters.findIndex(waiter => waiter.predicate(message));
		if (index === -1) {
			queue.push(message);
			return;
		}

		const [waiter] = waiters.splice(index, 1);
		clearTimeout(waiter.timer);
		waiter.resolve(message);
	});

	return {
		socket,
		open() {
			return new Promise((resolve, reject) => {
				socket.once("open", resolve);
				socket.once("error", reject);
			});
		},
		send(...message) {
			socket.send(JSON.stringify(message));
		},
		waitForType(type, timeout = 3000) {
			const predicate = message => Array.isArray(message) && message[0] === type;
			const queuedIndex = queue.findIndex(predicate);
			if (queuedIndex !== -1) return Promise.resolve(queue.splice(queuedIndex, 1)[0]);

			return new Promise((resolve, reject) => {
				const waiter = { predicate, resolve, reject, timer: undefined };
				waiter.timer = setTimeout(() => {
					const index = waiters.indexOf(waiter);
					if (index !== -1) waiters.splice(index, 1);
					reject(new Error("Timed out waiting for message: " + type));
				}, timeout);
				waiters.push(waiter);
			});
		},
	};
}

const server = createServer({ port });
let owner;
let guest;

try {
	await server.start();

	owner = createClient();
	await owner.open();
	const ownerLobby = await owner.waitForType("roomlist");
	assert.equal(typeof ownerLobby[4], "string");

	const roomKey = "room-owner-key";
	owner.send("server", "key", [roomKey, 27]);
	owner.send("server", "changeAvatar", "房主", "caocao");
	owner.send("server", "create", roomKey, "房主", "caocao", {
		mode: "identity",
		number: 2,
		observe: true,
	}, "identity");

	const created = await owner.waitForType("createroom");
	assert.equal(created[1], roomKey);

	guest = createClient();
	await guest.open();
	const guestLobby = await guest.waitForType("roomlist");
	const room = guestLobby[1].find(item => Array.isArray(item) && item[4] === roomKey);
	assert.ok(room, "created room should be visible in the lobby");
	assert.equal(room[2].mode, "identity");

	const guestId = guestLobby[4];
	guest.send("server", "key", ["guest-key", 27]);
	const ownerConnected = owner.waitForType("onconnection");
	guest.send("server", "enter", roomKey, "访客", "liubei");
	const connected = await ownerConnected;
	assert.equal(connected[1], guestId);

	const ownerMessage = owner.waitForType("onmessage");
	guest.send("init", 27, { id: guestId, nickname: "访客" }, []);
	const forwarded = await ownerMessage;
	assert.equal(forwarded[1], guestId);
	assert.deepEqual(JSON.parse(forwarded[2]).slice(0, 2), ["init", 27]);

	const guestMessage = guest.waitForType("opened");
	owner.send("server", "send", guestId, JSON.stringify(["opened"]));
	await guestMessage;

	const ownerClosed = owner.waitForType("onclose");
	guest.socket.close();
	const closed = await ownerClosed;
	assert.equal(closed[1], guestId);

	console.log("Multiplayer protocol test passed on port " + port);
} finally {
	if (guest && guest.socket.readyState === WebSocket.OPEN) guest.socket.close();
	if (owner && owner.socket.readyState === WebSocket.OPEN) owner.socket.close();
	await server.stop();
}
