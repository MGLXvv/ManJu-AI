export type RuntimeResourceKind = 'objectUrls' | 'timers' | 'subscriptions' | 'mountedEditors'

export interface RuntimeResourceSnapshot {
  objectUrls: number
  timers: number
  subscriptions: number
  mountedEditors: number
  capturedAt: string
}

interface RuntimeDiagnosticsBridge {
  snapshot: () => RuntimeResourceSnapshot
  createObjectUrlProbe: () => string
  revokeObjectUrlProbe: (url: string) => void
}

const counts: Record<RuntimeResourceKind, number> = {
  objectUrls: 0,
  timers: 0,
  subscriptions: 0,
  mountedEditors: 0,
}

const probeObjectUrls = new Set<string>()

const clampCount = (value: number): number => Math.max(0, Math.floor(value))

export const setRuntimeResourceCount = (kind: RuntimeResourceKind, value: number): void => {
  counts[kind] = clampCount(value)
}

export const retainRuntimeResource = (kind: RuntimeResourceKind): (() => void) => {
  counts[kind] += 1
  let released = false

  return () => {
    if (released) return
    released = true
    counts[kind] = clampCount(counts[kind] - 1)
  }
}

export const getRuntimeResourceSnapshot = (): RuntimeResourceSnapshot => ({
  objectUrls: counts.objectUrls + probeObjectUrls.size,
  timers: counts.timers,
  subscriptions: counts.subscriptions,
  mountedEditors: counts.mountedEditors,
  capturedAt: new Date().toISOString(),
})

const createObjectUrlProbe = (): string => {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return ''
  }

  const url = URL.createObjectURL(new Blob(['manju-runtime-diagnostic'], { type: 'text/plain' }))
  probeObjectUrls.add(url)
  return url
}

const revokeObjectUrlProbe = (url: string): void => {
  if (!probeObjectUrls.delete(url)) return
  if (url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url)
  }
}

export const installRuntimeResourceDiagnostics = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined

  const enabled = import.meta.env.DEV || import.meta.env.VITE_RUNTIME_DIAGNOSTICS === 'true'
  if (!enabled) return () => undefined

  const bridge: RuntimeDiagnosticsBridge = {
    snapshot: getRuntimeResourceSnapshot,
    createObjectUrlProbe,
    revokeObjectUrlProbe,
  }

  window.__MANJU_DIAGNOSTICS__ = bridge

  return () => {
    for (const url of [...probeObjectUrls]) {
      revokeObjectUrlProbe(url)
    }
    if (window.__MANJU_DIAGNOSTICS__ === bridge) {
      delete window.__MANJU_DIAGNOSTICS__
    }
  }
}
