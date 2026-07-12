import { access, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { sourceAssetExemptions, sourceAssetRules } from './build-budget.config.mjs'
import { collectFileStats, firstMatchingRule, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUTPUT_ROOT = path.join(ROOT, 'artifacts', 'quality')
const roots = ['src/assets', 'public']
const files = []

for (const relativeRoot of roots) {
  const absoluteRoot = path.join(ROOT, relativeRoot)
  try {
    await access(absoluteRoot)
    files.push(...await collectFileStats(ROOT, absoluteRoot))
  } catch {
    // Optional asset roots may be absent in smaller worktrees.
  }
}

const violations = []
const appliedExemptions = []
const inspectedAssets = []

for (const file of files) {
  const rule = firstMatchingRule(file.relativePath, sourceAssetRules)
  if (!rule) continue

  const exemption = firstMatchingRule(file.relativePath, sourceAssetExemptions)
  const maxBytes = exemption?.maxBytes ?? rule.maxBytes
  const record = {
    path: file.relativePath,
    bytes: file.size,
    displaySize: formatBytes(file.size),
    category: rule.name,
    maxBytes,
    displayLimit: formatBytes(maxBytes),
    exempted: Boolean(exemption),
    trackingIssue: exemption?.trackingIssue ?? null,
    reason: exemption?.reason ?? null,
    passed: file.size <= maxBytes,
  }
  inspectedAssets.push(record)

  if (!record.passed) {
    violations.push(
      `${file.relativePath} is ${record.displaySize}; ${exemption ? 'exemption' : rule.name} limit is ${record.displayLimit}.`,
    )
    continue
  }

  if (exemption) {
    appliedExemptions.push(
      `${file.relativePath}: ${record.displaySize} / ${record.displayLimit} (${exemption.trackingIssue}: ${exemption.reason})`,
    )
  }
}

await mkdir(OUTPUT_ROOT, { recursive: true })
await writeFile(
  path.join(OUTPUT_ROOT, 'source-assets.json'),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    passed: violations.length === 0,
    violations,
    exemptions: appliedExemptions,
    assets: inspectedAssets.sort((left, right) => right.bytes - left.bytes),
  }, null, 2)}\n`,
  'utf8',
)

if (violations.length > 0) {
  console.error('Source asset budget check failed:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Source asset budget check passed for ${files.length} files.`)
if (appliedExemptions.length > 0) {
  console.log('Tracked legacy exemptions:')
  for (const exemption of appliedExemptions) console.log(`- ${exemption}`)
}
