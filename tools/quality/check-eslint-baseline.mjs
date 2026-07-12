import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BASELINE_PATH = path.join(ROOT, 'tools', 'quality', 'eslint-baseline.json')
const REPORT_PATH = path.join(ROOT, 'artifacts', 'quality', 'eslint.json')
const writeBaseline = process.argv.includes('--write-baseline')

const eslint = new ESLint({ cwd: ROOT })
const report = await eslint.lintFiles(['.'])

await mkdir(path.dirname(REPORT_PATH), { recursive: true })
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

const findings = report.flatMap((file) => {
  const source = path.relative(ROOT, file.filePath).replaceAll('\\', '/')
  return file.messages
    .filter((message) => message.severity > 0)
    .map((message) => ({ source, rule: message.ruleId ?? 'parser-error' }))
})

const keyOf = (finding) => `${finding.source}::${finding.rule}`
const countByKey = (items) => {
  const counts = new Map()
  for (const item of items) counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1)
  return counts
}

const currentCounts = countByKey(findings)

if (writeBaseline) {
  const entries = [...currentCounts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => left.key.localeCompare(right.key))
  await writeFile(
    BASELINE_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2)}\n`,
    'utf8',
  )
  console.log(`ESLint baseline written: ${findings.length} findings across ${entries.length} signatures.`)
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
  console.error('ESLint regression check failed:')
  for (const regression of regressions) console.error(`- +${regression.count} ${regression.key}`)
  process.exit(1)
}

console.log(`ESLint regression check passed: ${findings.length} current findings, no increase from baseline.`)
if (improvements.length > 0) {
  console.log(`ESLint baseline can be reduced by ${improvements.reduce((sum, item) => sum + item.count, 0)} resolved findings.`)
}
