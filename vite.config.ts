import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'EPUB Online Viewer',
				short_name: 'EPUB Viewer',
				description: 'Read EPUB ebooks in the browser',
				theme_color: '#0d9488',
				background_color: '#faf8f5',
				display: 'standalone',
				start_url: '/',
				icons: [{ src: '/favicon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any maskable' }]
			}
		})
	]
});
