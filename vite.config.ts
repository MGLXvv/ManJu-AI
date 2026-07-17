import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const parseList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const resolveAssetInlining = (filePath: string): false | undefined =>
  filePath.toLowerCase().endsWith('.svg') ? false : undefined

export const resolveVendorChunk = (moduleId: string): string | undefined => {
  const normalizedId = moduleId.replaceAll('\\', '/')
  if (!normalizedId.includes('/node_modules/')) return undefined

  if (/\/node_modules\/(?:@vue\/|vue\/|vue-router\/|pinia\/|vue-i18n\/)/.test(normalizedId)) {
    return 'framework'
  }
  if (normalizedId.includes('/node_modules/axios/')) return 'http-vendor'

  return undefined
}

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
    build: {
      assetsInlineLimit: resolveAssetInlining,
      rollupOptions: {
        output: {
          manualChunks: resolveVendorChunk,
        },
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
      env: {
        VITE_API_MODE: 'mock',
        VITE_STRICT_RUNTIME_CONFIG: 'true',
      },
      coverage: {
        provider: 'v8',
        reportsDirectory: 'artifacts/coverage',
        reporter: ['text', 'json-summary', 'html', 'cobertura'],
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/assets/**', 'src/**/*.d.ts', 'src/main.ts'],
        thresholds: {
          statements: 43,
          branches: 39,
          functions: 44,
          lines: 43,
        },
      },
    },
  }
})
