import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
          'vendor-icons': ['lucide-react'],
          // Only reached through the lazy import in TrickOrTreating, so this
          // chunk stays out of the initial load for every other page.
          'vendor-map': ['leaflet', 'react-leaflet']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
