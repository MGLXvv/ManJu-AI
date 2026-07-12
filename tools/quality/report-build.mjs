import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildFileExemptions, buildReportTopFileCount } from './build-budget.config.mjs'
import { collectFileStats, firstMatchingRule, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_ROOT = path.join(ROOT, 'dist')
const OUTPUT_ROOT = path.join(ROOT, 'artifacts', 'build')

const files = await collectFileStats(ROOT, DIST_ROOT)
const createTotals = () => ({ total: 0, javascript: 0, css: 0, assets: 0 })
const addToTotals = (totals, file) => {
  totals.total += file.size
  if (file.extension === '.js') totals.javascript += file.size
  else if (file.extension === '.css') totals.css += file.size
  else totals.assets += file.size
}

const rawTotals = createTotals()
const budgetedTotals = createTotals()
const trackedLegacyFiles = []

for (const file of files) {
  addToTotals(rawTotals, file)
  const exemption = firstMatchingRule(file.relativePath, buildFileExemptions)

  if (exemption?.excludeFromTotal) {
    trackedLegacyFiles.push({
      path: file.relativePath,
      bytes: file.size,
      displaySize: formatBytes(file.size),
      trackingIssue: exemption.trackingIssue,
      reason: exemption.reason,
    })
  } else {
    addToTotals(budgetedTotals, file)
  }
}

const largestFiles = [...files]
  .sort((left, right) => right.size - left.size)
  .slice(0, buildReportTopFileCount)
  .map((file) => ({ path: file.relativePath, bytes: file.size, displaySize: formatBytes(file.size) }))

const displayTotals = (totals) => ({
  total: formatBytes(totals.total),
  javascript: formatBytes(totals.javascript),
  css: formatBytes(totals.css),
  assets: formatBytes(totals.assets),
})

const report = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  fileCount: files.length,
  totals: {
    raw: {
      bytes: rawTotals,
      display: displayTotals(rawTotals),
    },
    budgeted: {
      bytes: budgetedTotals,
      display: displayTotals(budgetedTotals),
    },
  },
  trackedLegacyFiles,
  largestFiles,
}

const markdown = [
  '# Frontend build report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '| Category | Raw size | Budgeted size |',
  '| --- | ---: | ---: |',
  `| Total dist | ${report.totals.raw.display.total} | ${report.totals.budgeted.display.total} |`,
  `| JavaScript | ${report.totals.raw.display.javascript} | ${report.totals.budgeted.display.javascript} |`,
  `| CSS | ${report.totals.raw.display.css} | ${report.totals.budgeted.display.css} |`,
  `| Other assets | ${report.totals.raw.display.assets} | ${report.totals.budgeted.display.assets} |`,
  '',
  'Budgeted totals exclude only explicitly bounded legacy files tracked by an open issue; every excluded file still has an individual maximum size.',
  '',
  '## Tracked legacy files',
  '',
  '| File | Size | Tracking | Reason |',
  '| --- | ---: | --- | --- |',
  ...(trackedLegacyFiles.length > 0
    ? trackedLegacyFiles.map((file) => `| \`${file.path}\` | ${file.displaySize} | ${file.trackingIssue} | ${file.reason} |`)
    : ['| _None_ | — | — | — |']),
  '',
  `## Largest ${largestFiles.length} files`,
  '',
  '| File | Size |',
  '| --- | ---: |',
  ...largestFiles.map((file) => `| \`${file.path}\` | ${file.displaySize} |`),
  '',
].join('\n')

await mkdir(OUTPUT_ROOT, { recursive: true })
await Promise.all([
  writeFile(path.join(OUTPUT_ROOT, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
  writeFile(path.join(OUTPUT_ROOT, 'build-report.md'), markdown, 'utf8'),
])

console.log(
  `Build report generated: ${report.fileCount} files, raw ${report.totals.raw.display.total}, budgeted ${report.totals.budgeted.display.total}.`,
)
