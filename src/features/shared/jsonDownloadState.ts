import { createObjectUrlRegistry, type ObjectUrlApi } from './objectUrlRegistryState'

export interface JsonDownloadAnchor {
  href: string
  download: string
  click(): void
}

export interface JsonDownloadEnvironment<TAnchor extends JsonDownloadAnchor = JsonDownloadAnchor> extends ObjectUrlApi {
  createAnchor(): TAnchor
  appendAnchor(anchor: TAnchor): void
  removeAnchor(anchor: TAnchor): void
  scheduleRelease(callback: () => void): void
}

export interface JsonDownloadController {
  downloadJson(fileName: string, payload: unknown): void
  releaseAll(): void
}

export const createJsonDownloadController = <TAnchor extends JsonDownloadAnchor>(
  environment: JsonDownloadEnvironment<TAnchor>,
): JsonDownloadController => {
  const urlRegistry = createObjectUrlRegistry(environment)

  const scheduleRelease = (url: string): void => {
    try {
      environment.scheduleRelease(() => urlRegistry.release(url))
    } catch (error) {
      urlRegistry.release(url)
      throw error
    }
  }

  return {
    downloadJson: (fileName, payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = urlRegistry.create(blob)
      let anchor: TAnchor | null = null
      let appended = false

      try {
        anchor = environment.createAnchor()
        anchor.href = url
        anchor.download = fileName
        environment.appendAnchor(anchor)
        appended = true
        anchor.click()
      } finally {
        try {
          if (appended && anchor) environment.removeAnchor(anchor)
        } finally {
          scheduleRelease(url)
        }
      }
    },
    releaseAll: () => urlRegistry.releaseAll(),
  }
}

export const createBrowserJsonDownloadController = (): JsonDownloadController =>
  createJsonDownloadController({
    createObjectURL: (blob) => URL.createObjectURL(blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement('a'),
    appendAnchor: (anchor) => document.body.appendChild(anchor),
    removeAnchor: (anchor) => document.body.removeChild(anchor),
    scheduleRelease: (callback) => queueMicrotask(callback),
  })
