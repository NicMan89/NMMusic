import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path - cambia se usi sottocartella su GitHub Pages
  // Es: se repo è "mymusic" usa: base: '/mymusic/'
  base: '/',
  
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
