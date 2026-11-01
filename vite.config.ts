import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // A custom domain (try.imagescript.dev) is served from the root path.
  base: '/',
  worker: {
    format: 'es'
  },
  build: {
    target: 'es2022',
    sourcemap: true
  }
});
