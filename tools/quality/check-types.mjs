import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const REPORT_PATH = path.join(ROOT, 'artifacts', 'quality', 'typecheck.log')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const result = spawnSync(pnpmCommand, ['exec', 'vue-tsc', '-b'], {
  cwd: ROOT,
  encoding: 'utf8',
  env: process.env,
  shell: false,
})

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
if (output) process.stdout.write(output)

await mkdir(path.dirname(REPORT_PATH), { recursive: true })
await writeFile(
  REPORT_PATH,
  `${output}${output.endsWith('\n') || !output ? '' : '\n'}exitCode=${result.status ?? 1}\n`,
  'utf8',
)

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
