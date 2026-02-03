// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare module 'virtual:pwa-info' {
	export const pwaInfo: { webManifest?: { linkTag: string } } | undefined;
}

declare module 'virtual:pwa-register' {
	export function registerSW(options?: { immediate?: boolean }): Promise<void>;
}

declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
