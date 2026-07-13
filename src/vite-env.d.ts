/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http'
  readonly VITE_API_BASE_URL?: string
  readonly VITE_STRICT_RUNTIME_CONFIG?: string
  readonly VITE_ENABLED_CAPABILITIES?: string
  readonly VITE_DISABLED_CAPABILITIES?: string
  readonly VITE_DEV_PROXY_TARGET?: string
  readonly VITE_DEV_ALLOWED_HOSTS?: string
  readonly VITE_RUNTIME_DIAGNOSTICS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __MANJU_DIAGNOSTICS__?: {
    snapshot: () => {
      objectUrls: number
      timers: number
      subscriptions: number
      mountedEditors: number
      capturedAt: string
    }
    createObjectUrlProbe: () => string
    revokeObjectUrlProbe: (url: string) => void
  }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module '*.scss'
