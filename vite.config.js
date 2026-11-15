import { defineConfig } from 'vite';

// Relative asset paths so the build works from any sub-folder
// (GitHub Pages serves this repo under /spelling-empire/).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1000 },
});
