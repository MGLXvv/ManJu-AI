export interface ObjectUrlApi {
  createObjectURL(blob: Blob): string
  revokeObjectURL(url: string): void
}

export interface ObjectUrlRegistry {
  create(blob: Blob): string
  release(url: string): void
  releaseAll(): void
}

export const createObjectUrlRegistry = (api: ObjectUrlApi): ObjectUrlRegistry => {
  const activeUrls = new Set<string>()

  const release = (url: string): void => {
    if (!activeUrls.delete(url)) return
    api.revokeObjectURL(url)
  }

  return {
    create: (blob) => {
      const url = api.createObjectURL(blob)
      activeUrls.add(url)
      return url
    },
    release,
    releaseAll: () => {
      for (const url of [...activeUrls]) {
        release(url)
      }
    },
  }
}
