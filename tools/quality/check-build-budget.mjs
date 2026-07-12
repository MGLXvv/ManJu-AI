import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildFileExemptions, buildFileRules, buildTotalBudgets } from './build-budget.config.mjs'
import { collectFileStats, firstMatchingRule, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_ROOT = path.join(ROOT, 'dist')
const files = await collectFileStats(ROOT, DIST_ROOT)
const violations = []
const appliedExemptions = []

for (const file of files) {
  const rule = firstMatchingRule(file.relativePath, buildFileRules)
  if (!rule) continue

  const exemption = firstMatchingRule(file.relativePath, buildFileExemptions)
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

const totals = files.reduce((result, file) => {
  result.dist += file.size
  if (file.extension === '.js') result.javascript += file.size
  else if (file.extension === '.css') result.css += file.size
  else result.assets += file.size
  return result
}, { javascript: 0, css: 0, assets: 0, dist: 0 })

for (const [category, maxBytes] of Object.entries(buildTotalBudgets)) {
  const current = totals[category]
  if (current > maxBytes) {
    violations.push(`Total ${category} size is ${formatBytes(current)}; limit is ${formatBytes(maxBytes)}.`)
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

if (violations.length > 0) {
  console.error('Production build budget check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(
  `Production build budget passed: JS ${formatBytes(totals.javascript)}, CSS ${formatBytes(totals.css)}, assets ${formatBytes(totals.assets)}, total ${formatBytes(totals.dist)}.`,
)
