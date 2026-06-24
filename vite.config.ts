import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'assessing-seventh-ecommerce-goals.trycloudflare.com',
    ],
    proxy: {
      '/admin-api': {
        target: 'http://10.10.3.26:48080',
        changeOrigin: true,
      },
    },
  },
  test: {
      include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
