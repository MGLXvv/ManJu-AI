import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE_URL = 'http://10.10.3.26:48080/admin-api'
const DEFAULT_TIMEOUT_MS = 15000
const REPORT_DIR = path.resolve('artifacts/integration')
const SENSITIVE_KEY = /(token|password|authorization|cookie|secret|credential)/i
const TRACE_HEADERS = ['x-request-id', 'request-id', 'x-trace-id', 'trace-id']
const GENERATED_CONTENT_FIELDS = ['content', 'scriptContent', 'generatedContent']

const normalizeBaseUrl = (value) => value.trim().replace(/\/+$/, '')

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
  )
}

const describeData = (value) => {
  if (value === null) return { type: 'null' }
  if (Array.isArray(value)) return { type: 'array', length: value.length }
  if (typeof value === 'object') return { type: 'object', keys: Object.keys(value).sort() }
  return { type: typeof value }
}

const readTraceHeaders = (headers) =>
  Object.fromEntries(TRACE_HEADERS.map((name) => [name, headers.get(name)]).filter(([, value]) => Boolean(value)))

class IntegrationRequestError extends Error {
  constructor(message, details) {
    super(message)
    this.name = 'IntegrationRequestError'
    this.details = details
  }
}

const requestCommonResult = async ({ baseUrl, endpoint, method = 'GET', token, body, timeoutMs, fetchImpl }) => {
  const response = await fetchImpl(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  })

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new IntegrationRequestError('Response is not valid JSON.', {
      httpStatus: response.status,
      trace: readTraceHeaders(response.headers),
    })
  }

  const summary = {
    httpStatus: response.status,
    code: payload?.code,
    msg: typeof payload?.msg === 'string' ? payload.msg : '',
    dataShape: describeData(payload?.data),
    trace: readTraceHeaders(response.headers),
  }

  if (!response.ok || payload?.code !== 0) {
    throw new IntegrationRequestError(
      `Request failed: ${method} ${endpoint} (HTTP ${response.status}, code ${String(payload?.code)})`,
      summary,
    )
  }

  return { data: payload.data, summary }
}

const extractAccessToken = (data) => {
  const token = data?.accessToken ?? data?.token
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Login response did not contain a usable access token.')
  }
  return token
}

const extractProjectId = (data) => {
  const rawId = typeof data === 'object' && data !== null ? (data.id ?? data.projectId) : data
  if (typeof rawId !== 'string' && typeof rawId !== 'number') {
    throw new Error('Project create response did not contain a usable project id.')
  }
  return String(rawId)
}

const observeGeneratedContent = (workspace) => {
  if (!workspace || typeof workspace !== 'object') {
    return { observable: false, field: null, value: null }
  }

  for (const field of GENERATED_CONTENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(workspace, field)) {
      return {
        observable: true,
        field,
        value: workspace[field] ?? null,
      }
    }
  }

  return { observable: false, field: null, value: null }
}

const snapshotWorkspace = (workspace) => ({
  dataShape: describeData(workspace),
  snapshot: sanitizeValue(workspace),
  generatedContent: observeGeneratedContent(workspace),
})

const buildStamp = (now) =>
  now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

const buildProjectName = (now = new Date()) => {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `frontend-script-workspace-test-${buildStamp(now)}-${suffix}`
}

const buildMarkers = (now = new Date()) => {
  const stamp = buildStamp(now)
  return {
    source: `script-source-${stamp}`,
    prompt: `script-prompt-${stamp}`,
    generated: `script-generated-${stamp}`,
  }
}

const normalizeError = (error) => ({
  name: error instanceof Error ? error.name : 'UnknownError',
  message: error instanceof Error ? error.message : String(error),
  details: error instanceof IntegrationRequestError ? sanitizeValue(error.details) : undefined,
})

const assertWorkspaceDraft = (workspace, markers) => {
  if (workspace?.rawText !== markers.source) {
    throw new Error('Reloaded script workspace did not contain the saved rawText marker.')
  }
  if (workspace?.prompt !== markers.prompt) {
    throw new Error('Reloaded script workspace did not contain the saved prompt marker.')
  }
}

const classifyGeneratedContent = (snapshots, expected) => {
  const observations = snapshots.map((item) => item.generatedContent)
  const matched = observations.find((item) => item.observable && item.value === expected)

  if (matched) {
    return {
      status: 'verified',
      field: matched.field,
      expected,
      observed: matched.value,
    }
  }

  const observable = observations.filter((item) => item.observable)
  if (observable.length === 0) {
    return {
      status: 'not-observable',
      field: null,
      expected,
      observed: null,
    }
  }

  return {
    status: 'mismatch',
    field: observable.map((item) => item.field).filter(Boolean),
    expected,
    observed: observable.map((item) => item.value),
  }
}

export const runScriptWorkspaceVerification = async (
  config,
  {
    fetchImpl = fetch,
    now = () => new Date(),
    projectName = buildProjectName(now()),
    markers = buildMarkers(now()),
  } = {},
) => {
  const report = {
    generatedAt: now().toISOString(),
    baseUrl: config.baseUrl,
    outcome: 'FAIL',
    success: false,
    writeEnabled: config.allowWrite,
    project: { name: projectName },
    markers,
    workspace: {
      snapshots: {},
      writeResponses: {},
    },
    steps: [],
    cleanup: { attempted: false, succeeded: false },
  }

  if (!config.allowWrite) {
    report.error = {
      name: 'WriteConfirmationRequired',
      message: 'Set MANJU_ALLOW_WRITE=true to permit temporary Script Workspace verification.',
    }
    return report
  }

  let token = ''
  let projectId = ''
  let deleted = false

  const executeStep = async (name, request) => {
    try {
      const result = await requestCommonResult({
        ...request,
        baseUrl: config.baseUrl,
        token: request.token === false ? undefined : token,
        timeoutMs: config.timeoutMs,
        fetchImpl,
      })
      report.steps.push({
        name,
        method: request.method ?? 'GET',
        endpoint: request.endpoint,
        ok: true,
        ...result.summary,
      })
      return result.data
    } catch (error) {
      const normalized = normalizeError(error)
      report.steps.push({
        name,
        method: request.method ?? 'GET',
        endpoint: request.endpoint,
        ok: false,
        ...(normalized.details ?? {}),
        error: normalized.message,
      })
      throw error
    }
  }

  try {
    const loginData = await executeStep('login', {
      endpoint: '/system/auth/login',
      method: 'POST',
      token: false,
      body: { username: config.username, password: config.password },
    })
    token = extractAccessToken(loginData)

    await executeStep('profile', { endpoint: '/system/auth/profile' })

    const createData = await executeStep('create-project', {
      endpoint: '/aidrama/projects',
      method: 'POST',
      body: {
        name: projectName,
        description: 'Temporary Script Workspace integration verification project',
        aspectRatio: '16:9',
        style: 'anime',
        language: 'zh-CN',
        durationSeconds: 60,
      },
    })
    projectId = extractProjectId(createData)
    report.project.id = projectId

    const workspaceEndpoint = `/aidrama/projects/${encodeURIComponent(projectId)}/script/workspace`
    const initialWorkspace = await executeStep('load-initial-workspace', {
      endpoint: workspaceEndpoint,
    })
    report.workspace.initialStatus = initialWorkspace?.scriptStatus ?? null
    report.workspace.snapshots.initial = snapshotWorkspace(initialWorkspace)

    const draftWriteResponse = await executeStep('save-script-draft', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}/script/draft`,
      method: 'PUT',
      body: { rawText: markers.source, prompt: markers.prompt },
    })
    report.workspace.writeResponses.draft = sanitizeValue(draftWriteResponse)

    const reloadedDraft = await executeStep('reload-script-draft', {
      endpoint: workspaceEndpoint,
    })
    assertWorkspaceDraft(reloadedDraft, markers)
    report.workspace.snapshots.afterDraft = snapshotWorkspace(reloadedDraft)

    const contentWriteResponse = await executeStep('save-script-content', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}/script/content`,
      method: 'PUT',
      body: { content: markers.generated },
    })
    report.workspace.writeResponses.content = sanitizeValue(contentWriteResponse)

    const reloadedContent = await executeStep('reload-script-content', {
      endpoint: workspaceEndpoint,
    })
    assertWorkspaceDraft(reloadedContent, markers)
    report.workspace.snapshots.afterContent = snapshotWorkspace(reloadedContent)

    const confirmResponse = await executeStep('confirm-script', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}/script/confirm`,
      method: 'POST',
    })
    report.workspace.writeResponses.confirm = sanitizeValue(confirmResponse)

    const confirmedWorkspace = await executeStep('reload-confirmed-workspace', {
      endpoint: workspaceEndpoint,
    })
    assertWorkspaceDraft(confirmedWorkspace, markers)
    report.workspace.snapshots.afterConfirm = snapshotWorkspace(confirmedWorkspace)
    report.workspace.confirmedStatus = confirmedWorkspace?.scriptStatus ?? null
    report.workspace.canEnterStoryboard = confirmedWorkspace?.canEnterStoryboard ?? null
    report.workspace.revision = confirmedWorkspace?.revision ?? confirmedWorkspace?.version ?? null
    report.workspace.generatedContentVerification = classifyGeneratedContent(
      [report.workspace.snapshots.afterContent, report.workspace.snapshots.afterConfirm],
      markers.generated,
    )

    await executeStep('delete-project', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
      method: 'DELETE',
    })
    deleted = true

    const listData = await executeStep('verify-project-absent', {
      endpoint: `/aidrama/projects?pageNo=1&pageSize=20&status=ALL&keyword=${encodeURIComponent(projectName)}`,
    })
    const list = Array.isArray(listData?.list) ? listData.list : []
    if (list.some((item) => String(item?.id ?? '') === projectId)) {
      throw new Error('Deleted Script Workspace test project is still present in the project list.')
    }

    const contentVerificationStatus = report.workspace.generatedContentVerification.status
    if (contentVerificationStatus === 'verified') {
      report.outcome = 'PASS'
      report.success = true
    } else if (contentVerificationStatus === 'not-observable') {
      report.outcome = 'PARTIAL'
      report.warning = {
        name: 'GeneratedContentNotObservable',
        message:
          'The content write succeeded, but Script Workspace did not expose content, scriptContent, or generatedContent.',
      }
    } else {
      report.outcome = 'FAIL'
      report.error = {
        name: 'GeneratedContentMismatch',
        message: 'Script Workspace exposed a generated-content field, but its value did not match the saved marker.',
      }
    }
  } catch (error) {
    report.outcome = 'FAIL'
    report.success = false
    report.error = normalizeError(error)
  } finally {
    if (projectId && !deleted && token) {
      report.cleanup.attempted = true
      try {
        const cleanup = await requestCommonResult({
          baseUrl: config.baseUrl,
          endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
          method: 'DELETE',
          token,
          timeoutMs: config.timeoutMs,
          fetchImpl,
        })
        report.cleanup.succeeded = true
        report.cleanup.httpStatus = cleanup.summary.httpStatus
        report.cleanup.code = cleanup.summary.code
      } catch (error) {
        report.cleanup.error = normalizeError(error)
      }
    }
  }

  return sanitizeValue(report)
}

const writeReport = async (report) => {
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(path.join(REPORT_DIR, 'script-workspace-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

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

  const report = await runScriptWorkspaceVerification(config)
  await writeReport(report)

  console.log(`Script Workspace verification: ${report.outcome}`)
  console.log('Report: artifacts/integration/script-workspace-report.json')
  if (report.outcome === 'FAIL') process.exitCode = 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  await main()
}
