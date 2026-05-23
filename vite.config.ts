import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, 'src'),
      "#": path.resolve(__dirname, 'server'),
    }
  },
  server: {
    host:"0.0.0.0",
    proxy: {
      '/api': {
        target: 'http://localhost:3122',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
