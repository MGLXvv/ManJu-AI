import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

export const KIB = 1024
export const MIB = 1024 * KIB

export const formatBytes = (bytes) => {
  if (bytes >= MIB) return `${(bytes / MIB).toFixed(2)} MiB`
  if (bytes >= KIB) return `${(bytes / KIB).toFixed(2)} KiB`
  return `${bytes} B`
}

export const normalizePath = (value) => value.split(path.sep).join('/')

export const walkFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walkFiles(absolute))
    else if (entry.isFile()) files.push(absolute)
  }

  return files
}

export const collectFileStats = async (root, directory) => {
  const files = await walkFiles(directory)
  return Promise.all(files.map(async (absolutePath) => {
    const metadata = await stat(absolutePath)
    return {
      absolutePath,
      relativePath: normalizePath(path.relative(root, absolutePath)),
      size: metadata.size,
      extension: path.extname(absolutePath).toLowerCase(),
    }
  }))
}

export const firstMatchingRule = (relativePath, rules) => rules.find((rule) => rule.test.test(relativePath)) ?? null
