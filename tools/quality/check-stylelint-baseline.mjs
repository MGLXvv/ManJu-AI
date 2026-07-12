import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BASELINE_PATH = path.join(ROOT, 'tools', 'quality', 'stylelint-baseline.json')
const writeBaseline = process.argv.includes('--write-baseline')
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

const result = spawnSync(
  pnpm,
  ['exec', 'stylelint', 'src/**/*.scss', '--formatter', 'json', '--allow-empty-input'],
  { cwd: ROOT, encoding: 'utf8' },
)

if (result.error) throw result.error
if (!result.stdout.trim()) {
  process.stderr.write(result.stderr)
  throw new Error('Stylelint did not return a JSON report.')
}

const report = JSON.parse(result.stdout)
const violations = report.flatMap((file) => {
  const source = path.relative(ROOT, file.source).replaceAll('\\', '/')
  return file.warnings.map((warning) => ({
    source,
    line: warning.line,
    column: warning.column,
    rule: warning.rule,
    text: warning.text.replace(/\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*$/, '').trim(),
  }))
})

const toKey = (violation) => `${violation.source}::${violation.rule}::${violation.text}`
const countByKey = (items) => {
  const counts = new Map()
  for (const item of items) counts.set(toKey(item), (counts.get(toKey(item)) ?? 0) + 1)
  return counts
}

const currentCounts = countByKey(violations)

if (writeBaseline) {
  const entries = [...currentCounts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => left.key.localeCompare(right.key))

  await mkdir(path.dirname(BASELINE_PATH), { recursive: true })
  await writeFile(
    BASELINE_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2)}\n`,
    'utf8',
  )
  console.log(`Stylelint baseline written: ${violations.length} existing violations across ${entries.length} signatures.`)
  process.exit(0)
}

const baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8'))
const baselineCounts = new Map(baseline.entries.map((entry) => [entry.key, entry.count]))
const regressions = []
const improvements = []

for (const [key, count] of currentCounts) {
  const allowed = baselineCounts.get(key) ?? 0
  if (count > allowed) regressions.push({ key, count: count - allowed })
}

for (const [key, count] of baselineCounts) {
  const current = currentCounts.get(key) ?? 0
  if (current < count) improvements.push({ key, count: count - current })
}

if (regressions.length > 0) {
  console.error('Stylelint regression check failed:')
  for (const regression of regressions) console.error(`- +${regression.count} ${regression.key}`)
  process.exit(1)
}

console.log(`Stylelint regression check passed: ${violations.length} current violations, no increase from baseline.`)
if (improvements.length > 0) {
  console.log(`Stylelint baseline can be reduced by ${improvements.reduce((sum, item) => sum + item.count, 0)} resolved violations.`)
}
