import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildFileExemptions, buildFileRules, buildTotalBudgets } from './build-budget.config.mjs'
import { collectFileStats, firstMatchingRule, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_ROOT = path.join(ROOT, 'dist')
const OUTPUT_ROOT = path.join(ROOT, 'artifacts', 'quality')
const files = await collectFileStats(ROOT, DIST_ROOT)
const violations = []
const appliedExemptions = []
const trackedLegacyFiles = []

const createTotals = () => ({ javascript: 0, css: 0, assets: 0, dist: 0 })
const addToTotals = (totals, file) => {
  totals.dist += file.size
  if (file.extension === '.js') totals.javascript += file.size
  else if (file.extension === '.css') totals.css += file.size
  else totals.assets += file.size
}

const rawTotals = createTotals()
const budgetedTotals = createTotals()

for (const file of files) {
  addToTotals(rawTotals, file)

  const rule = firstMatchingRule(file.relativePath, buildFileRules)
  const exemption = firstMatchingRule(file.relativePath, buildFileExemptions)

  if (!exemption?.excludeFromTotal) addToTotals(budgetedTotals, file)
  else {
    trackedLegacyFiles.push({
      path: file.relativePath,
      bytes: file.size,
      displaySize: formatBytes(file.size),
      trackingIssue: exemption.trackingIssue,
      reason: exemption.reason,
    })
  }

  if (!rule) continue

  const maxBytes = exemption?.maxBytes ?? rule.maxBytes
  if (file.size > maxBytes) {
    violations.push(
      `${file.relativePath} is ${formatBytes(file.size)}; ${exemption ? 'exemption' : rule.name} limit is ${formatBytes(maxBytes)}.`,
    )
    continue
  }

  if (exemption) {
    appliedExemptions.push(
      `${file.relativePath}: ${formatBytes(file.size)} / ${formatBytes(maxBytes)} (${exemption.trackingIssue}: ${exemption.reason})`,
    )
  }
}

for (const [category, maxBytes] of Object.entries(buildTotalBudgets)) {
  const current = budgetedTotals[category]
  if (current > maxBytes) {
    violations.push(`Budgeted ${category} size is ${formatBytes(current)}; limit is ${formatBytes(maxBytes)}.`)
  }
}

const largestFiles = [...files]
  .sort((left, right) => right.size - left.size)
  .slice(0, 10)

console.log('Largest build files:')
for (const file of largestFiles) console.log(`- ${file.relativePath}: ${formatBytes(file.size)}`)

if (appliedExemptions.length > 0) {
  console.log('Tracked build exemptions:')
  for (const exemption of appliedExemptions) console.log(`- ${exemption}`)
}

await mkdir(OUTPUT_ROOT, { recursive: true })
await writeFile(
  path.join(OUTPUT_ROOT, 'build-budget.json'),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    passed: violations.length === 0,
    rawTotals,
    budgetedTotals,
    limits: buildTotalBudgets,
    trackedLegacyFiles,
    exemptions: appliedExemptions,
    violations,
  }, null, 2)}\n`,
  'utf8',
)

if (violations.length > 0) {
  console.error('Production build budget check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(
  `Production build budget passed: budgeted JS ${formatBytes(budgetedTotals.javascript)}, CSS ${formatBytes(budgetedTotals.css)}, assets ${formatBytes(budgetedTotals.assets)}, total ${formatBytes(budgetedTotals.dist)}; raw total ${formatBytes(rawTotals.dist)}.`,
)
