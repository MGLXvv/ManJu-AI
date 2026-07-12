import { access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { sourceAssetExemptions, sourceAssetRules } from './build-budget.config.mjs'
import { collectFileStats, firstMatchingRule, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
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

for (const file of files) {
  const rule = firstMatchingRule(file.relativePath, sourceAssetRules)
  if (!rule) continue

  const exemption = firstMatchingRule(file.relativePath, sourceAssetExemptions)
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
