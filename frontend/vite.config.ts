import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },

    
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    },
    watch: {
      // Reduce file watching to prevent excessive reloads
      ignored: ['**/node_modules/**', '**/.git/**'],
      usePolling: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
