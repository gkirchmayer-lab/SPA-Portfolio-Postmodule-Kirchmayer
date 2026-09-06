import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Relative base so the built site works under a GitHub Pages project
// subpath like https://<user>.github.io/<repo>/ regardless of repo name.
export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: 'all'
  }
});
