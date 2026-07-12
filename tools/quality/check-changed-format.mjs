import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { check, getFileInfo, resolveConfig } from 'prettier'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPORT_PATH = path.join(ROOT, 'artifacts', 'quality', 'prettier.json')
const supported = /\.(?:c?js|mjs|ts|tsx|vue|css|scss|json|md|ya?ml)$/i
const ignored = [
  /^artifacts\//,
  /^coverage\//,
  /^dist\//,
  /^node_modules\//,
  /^public\/mock-media\//,
  /^src\/assets\/iconfont\//,
  /^pnpm-lock\.yaml$/,
]

const normalize = (value) => value.replaceAll('\\', '/')
const runGit = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()

const resolveBase = () => {
  const candidates = [
    process.env.FORMAT_BASE_REF,
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : '',
    'HEAD^',
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      runGit(['rev-parse', '--verify', candidate])
      return candidate
    } catch {
      // Try the next base candidate.
    }
  }

  return null
}

const base = resolveBase()
if (!base) {
  console.log('Prettier check skipped: no comparison base is available.')
  process.exit(0)
}

const files = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`])
  .split(/\r?\n/)
  .map(normalize)
  .filter(Boolean)
  .filter((file) => supported.test(file))
  .filter((file) => !ignored.some((pattern) => pattern.test(file)))

if (files.length === 0) {
  console.log('Prettier check passed: no changed supported files.')
  process.exit(0)
}

const results = []

for (const file of files) {
  const absolutePath = path.join(ROOT, file)
  const fileInfo = await getFileInfo(absolutePath)
  if (fileInfo.ignored || !fileInfo.inferredParser) {
    results.push({ file, formatted: true, skipped: true, parser: fileInfo.inferredParser })
    continue
  }

  const source = await readFile(absolutePath, 'utf8')
  const config = (await resolveConfig(absolutePath)) ?? {}
  const formatted = await check(source, { ...config, filepath: absolutePath })
  results.push({ file, formatted, skipped: false, parser: fileInfo.inferredParser })
}

await mkdir(path.dirname(REPORT_PATH), { recursive: true })
await writeFile(REPORT_PATH, `${JSON.stringify({ base, results }, null, 2)}\n`, 'utf8')

const unformatted = results.filter((result) => !result.formatted).map((result) => result.file)
if (unformatted.length > 0) {
  console.error('Prettier check failed for changed files:')
  for (const file of unformatted) console.error(`- ${file}`)
  process.exit(1)
}

console.log(`Prettier check passed for ${files.length} changed files.`)
