import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = parseList(env.VITE_DEV_ALLOWED_HOSTS)
  const proxyTarget = env.VITE_DEV_PROXY_TARGET?.trim()

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: '0.0.0.0',
      ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
      ...(proxyTarget
        ? {
            proxy: {
              '/admin-api': {
                target: proxyTarget,
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  }
})
