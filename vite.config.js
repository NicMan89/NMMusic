import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path - per GitHub Pages
  base: '/NMMusic/',
  
  // Build options
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        }
      }
    }
  },
  
  // Server options per sviluppo
  server: {
    port: 5173,
    open: true,
    host: true
  },
  
  // Preview server options
  preview: {
    port: 4173,
    open: true
  }
});
