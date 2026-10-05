import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => (id.includes('node_modules/@firebase/') || id.includes('node_modules/firebase/') ? 'firebase' : undefined),
			},
		},
	},
});
