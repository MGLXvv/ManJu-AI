import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { runScriptWorkspaceVerification } from './script-workspace.mjs'

const DEFAULT_BASE_URL = 'http://10.10.3.26:48080/admin-api'
const DEFAULT_TIMEOUT_MS = 15000
const REPORT_DIR = path.resolve('artifacts/integration')

const normalizeBaseUrl = (value) => value.trim().replace(/\/+$/, '')

export const createScriptContentRequestAdapter = (fetchImpl = fetch) => async (input, init = {}) => {
  const url = new URL(String(input))
  const method = init.method ?? 'GET'

  if (method !== 'PUT' || !url.pathname.endsWith('/script/content') || init.body === undefined) {
    return fetchImpl(input, init)
  }

  const body = JSON.parse(String(init.body))
  if (!Object.prototype.hasOwnProperty.call(body, 'content')) {
    return fetchImpl(input, init)
  }

  const { content, ...rest } = body
  return fetchImpl(input, {
    ...init,
    body: JSON.stringify({ ...rest, scriptContent: content }),
  })
}

const writeReport = async (report) => {
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(
    path.join(REPORT_DIR, 'script-workspace-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  )

  const lines = [
    '# Live Script Workspace Verification',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Result: ${report.outcome}`,
    `- Temporary project: ${report.project?.name ?? 'not created'}`,
    `- Confirmed status: ${report.workspace?.confirmedStatus ?? 'not reported'}`,
    `- Can enter storyboard: ${String(report.workspace?.canEnterStoryboard ?? 'not reported')}`,
    `- Generated content: ${report.workspace?.generatedContentVerification?.status ?? 'not evaluated'}`,
    `- Backend revision/version: ${String(report.workspace?.revision ?? 'not reported')}`,
    `- Cleanup attempted: ${report.cleanup?.attempted ? 'yes' : 'no'}`,
    `- Cleanup succeeded: ${report.cleanup?.succeeded ? 'yes' : 'no'}`,
    '',
    '## Steps',
    '',
    '| Step | Method | Endpoint | Result | HTTP | Code |',
    '| --- | --- | --- | --- | ---: | ---: |',
    ...report.steps.map(
      (step) =>
        `| ${step.name} | ${step.method} | \`${step.endpoint}\` | ${step.ok ? 'PASS' : 'FAIL'} | ${step.httpStatus ?? ''} | ${step.code ?? ''} |`,
    ),
    '',
  ]

  if (report.warning) {
    lines.push('## Warning', '', `- ${report.warning.name}: ${report.warning.message}`, '')
  }

  if (report.error) {
    lines.push('## Error', '', `- ${report.error.name}: ${report.error.message}`, '')
  }

  await writeFile(path.join(REPORT_DIR, 'script-workspace-report.md'), `${lines.join('\n')}\n`, 'utf8')
}

const readConfig = () => ({
  baseUrl: normalizeBaseUrl(process.env.MANJU_API_BASE_URL || DEFAULT_BASE_URL),
  username: process.env.MANJU_USERNAME?.trim() ?? '',
  password: process.env.MANJU_PASSWORD ?? '',
  allowWrite: process.env.MANJU_ALLOW_WRITE?.trim().toLowerCase() === 'true',
  timeoutMs: Number.parseInt(process.env.MANJU_REQUEST_TIMEOUT_MS ?? '', 10) || DEFAULT_TIMEOUT_MS,
})

const main = async () => {
  const config = readConfig()
  if (!config.username || !config.password) {
    console.error('MANJU_USERNAME and MANJU_PASSWORD are required.')
    process.exitCode = 1
    return
  }

  const report = await runScriptWorkspaceVerification(config, {
    fetchImpl: createScriptContentRequestAdapter(fetch),
  })
  await writeReport(report)

  console.log(`Script Workspace verification: ${report.outcome}`)
  console.log('Report: artifacts/integration/script-workspace-report.json')
  if (report.outcome === 'FAIL') process.exitCode = 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  await main()
}
