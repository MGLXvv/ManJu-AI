import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DEFAULT_BASE_URL = 'http://10.10.3.26:48080/admin-api'
const DEFAULT_TIMEOUT_MS = 15000
const REPORT_DIR = path.resolve('artifacts/integration')
const SENSITIVE_KEY = /(token|password|authorization|cookie|secret|credential)/i
const TRACE_HEADERS = ['x-request-id', 'request-id', 'x-trace-id', 'trace-id']

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

const buildProjectName = (now = new Date()) => {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
  const suffix = Math.random().toString(36).slice(2, 8)
  return `frontend-contract-test-${stamp}-${suffix}`
}

const normalizeError = (error) => ({
  name: error instanceof Error ? error.name : 'UnknownError',
  message: error instanceof Error ? error.message : String(error),
  details: error instanceof IntegrationRequestError ? sanitizeValue(error.details) : undefined,
})

export const runProjectCrudVerification = async (
  config,
  { fetchImpl = fetch, now = () => new Date(), projectName = buildProjectName(now()) } = {},
) => {
  const report = {
    generatedAt: now().toISOString(),
    baseUrl: config.baseUrl,
    success: false,
    writeEnabled: config.allowWrite,
    project: { name: projectName },
    steps: [],
    cleanup: { attempted: false, succeeded: false },
  }

  if (!config.allowWrite) {
    report.error = {
      name: 'WriteConfirmationRequired',
      message: 'Set MANJU_ALLOW_WRITE=true to permit temporary project creation and deletion.',
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
        description: 'Temporary frontend integration verification project',
        aspectRatio: '16:9',
        style: 'anime',
        language: 'zh-CN',
        durationSeconds: 60,
      },
    })
    projectId = extractProjectId(createData)
    report.project.id = projectId

    const detailData = await executeStep('get-created-project', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
    })
    if (String(detailData?.id ?? '') !== projectId) {
      throw new Error('Created project detail id did not match the create response.')
    }

    const renamedProject = `${projectName}-renamed`
    await executeStep('rename-project', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
      method: 'PUT',
      body: { name: renamedProject },
    })

    const updatedDetail = await executeStep('get-renamed-project', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
    })
    if (updatedDetail?.name !== renamedProject) {
      throw new Error('Project detail did not reflect the renamed project name.')
    }
    report.project.renamedTo = renamedProject

    await executeStep('delete-project', {
      endpoint: `/aidrama/projects/${encodeURIComponent(projectId)}`,
      method: 'DELETE',
    })
    deleted = true

    const listData = await executeStep('verify-project-absent', {
      endpoint: `/aidrama/projects?pageNo=1&pageSize=20&status=ALL&keyword=${encodeURIComponent(renamedProject)}`,
    })
    const list = Array.isArray(listData?.list) ? listData.list : []
    if (list.some((item) => String(item?.id ?? '') === projectId)) {
      throw new Error('Deleted project is still present in the filtered project list.')
    }

    report.success = true
  } catch (error) {
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
  await writeFile(path.join(REPORT_DIR, 'project-crud-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const lines = [
    '# Live Project CRUD Verification',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Result: ${report.success ? 'PASS' : 'FAIL'}`,
    `- Temporary project: ${report.project?.name ?? 'not created'}`,
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

  if (report.error) {
    lines.push('## Error', '', `- ${report.error.name}: ${report.error.message}`, '')
  }

  await writeFile(path.join(REPORT_DIR, 'project-crud-report.md'), `${lines.join('\n')}\n`, 'utf8')
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

  const report = await runProjectCrudVerification(config)
  await writeReport(report)

  console.log(`Project CRUD verification: ${report.success ? 'PASS' : 'FAIL'}`)
  console.log('Report: artifacts/integration/project-crud-report.json')
  if (!report.success) process.exitCode = 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  await main()
}
