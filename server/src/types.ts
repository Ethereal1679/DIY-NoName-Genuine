export interface ServerOptions {
	port?: number;
	/** Network interface to bind. Defaults to all IPv4 interfaces for LAN play. */
	host?: string;
}

export interface ServerInstance {
	start(): Promise<void>;
	stop(): Promise<void>;
}
