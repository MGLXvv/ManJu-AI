import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SRC_ROOT = path.join(ROOT, 'src')
const API_ROOT = path.join(SRC_ROOT, 'api')
const EXTENSIONS = ['.ts', '.tsx', '.vue', '.js', '.mjs']
const IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else files.push(absolute)
  }
  return files
}

const normalize = (value) => value.split(path.sep).join('/')

const resolveModule = async (fromFile, specifier) => {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null
  const base = specifier.startsWith('@/')
    ? path.join(SRC_ROOT, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier)
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ]
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {
      // Continue resolving alternative extensions.
    }
  }
  return null
}

const isMockPath = (filePath) => {
  const relative = normalize(path.relative(ROOT, filePath))
  return relative.includes('/mocks/') || relative.endsWith('.mock.ts') || relative.endsWith('.mock.tsx')
}

const allFiles = await walk(API_ROOT)
const entryFiles = allFiles.filter((file) => file.endsWith('.http.ts'))
const violations = []

for (const entryFile of entryFiles) {
  const queue = [{ file: entryFile, chain: [entryFile] }]
  const visited = new Set()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current.file)) continue
    visited.add(current.file)

    const source = await readFile(current.file, 'utf8')
    for (const match of source.matchAll(IMPORT_PATTERN)) {
      const specifier = match[1]
      if (!specifier) continue
      const resolved = await resolveModule(current.file, specifier)
      if (!resolved) continue
      const chain = [...current.chain, resolved]
      if (isMockPath(resolved)) {
        violations.push(chain.map((item) => normalize(path.relative(ROOT, item))).join(' -> '))
        continue
      }
      if (resolved.startsWith(SRC_ROOT)) queue.push({ file: resolved, chain })
    }
  }
}

if (violations.length > 0) {
  console.error('HTTP adapter mock dependency violations:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`HTTP mock boundary check passed for ${entryFiles.length} adapters.`)
