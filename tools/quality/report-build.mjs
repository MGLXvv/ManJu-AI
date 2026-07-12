import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildReportTopFileCount } from './build-budget.config.mjs'
import { collectFileStats, formatBytes } from './file-utils.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIST_ROOT = path.join(ROOT, 'dist')
const OUTPUT_ROOT = path.join(ROOT, 'artifacts', 'build')

const files = await collectFileStats(ROOT, DIST_ROOT)
const totals = files.reduce((result, file) => {
  result.total += file.size
  if (file.extension === '.js') result.javascript += file.size
  else if (file.extension === '.css') result.css += file.size
  else result.assets += file.size
  return result
}, { total: 0, javascript: 0, css: 0, assets: 0 })

const largestFiles = [...files]
  .sort((left, right) => right.size - left.size)
  .slice(0, buildReportTopFileCount)
  .map((file) => ({ path: file.relativePath, bytes: file.size, displaySize: formatBytes(file.size) }))

const report = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  fileCount: files.length,
  totals: {
    bytes: totals,
    display: {
      total: formatBytes(totals.total),
      javascript: formatBytes(totals.javascript),
      css: formatBytes(totals.css),
      assets: formatBytes(totals.assets),
    },
  },
  largestFiles,
}

const markdown = [
  '# Frontend build report',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '| Category | Size |',
  '| --- | ---: |',
  `| Total dist | ${report.totals.display.total} |`,
  `| JavaScript | ${report.totals.display.javascript} |`,
  `| CSS | ${report.totals.display.css} |`,
  `| Other assets | ${report.totals.display.assets} |`,
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

console.log(`Build report generated: ${report.fileCount} files, ${report.totals.display.total}.`)
