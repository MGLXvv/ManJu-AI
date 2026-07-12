import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { collectFileStats } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SRC_ROOT = path.join(ROOT, 'src')
const sourceFiles = (await collectFileStats(ROOT, SRC_ROOT))
  .filter((file) => /\.(?:ts|tsx|js|mjs|vue)$/.test(file.relativePath))

const forbiddenPatterns = [
  {
    name: 'debugger statement',
    test: /\bdebugger\s*;/,
  },
  {
    name: 'debug console call',
    test: /\bconsole\.(?:log|debug|trace)\s*\(/,
  },
  {
    name: 'TypeScript file-wide suppression',
    test: /@ts-nocheck/,
  },
  {
    name: 'static login background import',
    test: /from\s+['"]@\/assets\/auth\/login-bg-[^'"]+['"]/,
  },
]

const violations = []

for (const file of sourceFiles) {
  const source = await readFile(file.absolutePath, 'utf8')
  const lines = source.split(/\r?\n/)

  lines.forEach((line, index) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test.test(line)) {
        violations.push(`${file.relativePath}:${index + 1} contains ${pattern.name}.`)
      }
    }
  })
}

if (violations.length > 0) {
  console.error('Source hygiene check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Source hygiene check passed for ${sourceFiles.length} production source files.`)
