import { execFileSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
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

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const result = spawnSync(pnpm, ['exec', 'prettier', '--check', ...files], {
  cwd: ROOT,
  encoding: 'utf8',
  stdio: 'inherit',
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
