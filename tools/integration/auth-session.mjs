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

const requestResult = async ({ baseUrl, endpoint, method = 'GET', token, body, timeoutMs, fetchImpl }) => {
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
    return {
      ok: false,
      httpStatus: response.status,
      code: undefined,
      msg: 'Response is not valid JSON.',
      dataShape: { type: 'unknown' },
      trace: readTraceHeaders(response.headers),
    }
  }

  return {
    ok: response.ok && payload?.code === 0,
    httpStatus: response.status,
    code: payload?.code,
    msg: typeof payload?.msg === 'string' ? payload.msg : '',
    data: payload?.data,
    dataShape: describeData(payload?.data),
    trace: readTraceHeaders(response.headers),
  }
}

const extractAccessToken = (data) => {
  const token = data?.accessToken ?? data?.token
  if (typeof token !== 'string' || !token.trim()) {
    throw new Error('Login response did not contain a usable access token.')
  }
  return token
}

const toStep = (name, method, endpoint, result, expected) => ({
  name,
  method,
  endpoint,
  ok: expected(result),
  httpStatus: result.httpStatus,
  code: result.code,
  msg: result.msg,
  dataShape: result.dataShape,
  trace: result.trace,
})

const normalizeError = (error) => ({
  name: error instanceof Error ? error.name : 'UnknownError',
  message: error instanceof Error ? error.message : String(error),
})

export const runAuthSessionVerification = async (config, { fetchImpl = fetch, now = () => new Date() } = {}) => {
  const report = {
    generatedAt: now().toISOString(),
    baseUrl: config.baseUrl,
    success: false,
    steps: [],
  }

  try {
    const login = await requestResult({
      baseUrl: config.baseUrl,
      endpoint: '/system/auth/login',
      method: 'POST',
      body: { username: config.username, password: config.password },
      timeoutMs: config.timeoutMs,
      fetchImpl,
    })
    const loginStep = toStep('login', 'POST', '/system/auth/login', login, (result) => result.ok)
    report.steps.push(loginStep)
    if (!loginStep.ok) throw new Error(`Login failed with code ${String(login.code)}.`)

    const token = extractAccessToken(login.data)
    const profile = await requestResult({
      baseUrl: config.baseUrl,
      endpoint: '/system/auth/profile',
      token,
      timeoutMs: config.timeoutMs,
      fetchImpl,
    })
    const profileStep = toStep('profile-valid-token', 'GET', '/system/auth/profile', profile, (result) => result.ok)
    report.steps.push(profileStep)
    if (!profileStep.ok) throw new Error(`Valid-token profile failed with code ${String(profile.code)}.`)

    const invalidProfile = await requestResult({
      baseUrl: config.baseUrl,
      endpoint: '/system/auth/profile',
      token: `${token}-invalid`,
      timeoutMs: config.timeoutMs,
      fetchImpl,
    })
    const invalidStep = toStep(
      'profile-invalid-token',
      'GET',
      '/system/auth/profile',
      invalidProfile,
      (result) => result.httpStatus === 401 || result.code === 401,
    )
    report.steps.push(invalidStep)
    if (!invalidStep.ok) {
      throw new Error(
        `Invalid-token profile did not return an unauthorized result (HTTP ${invalidProfile.httpStatus}, code ${String(invalidProfile.code)}).`,
      )
    }

    report.unauthorizedContract = {
      httpStatus: invalidProfile.httpStatus,
      code: invalidProfile.code,
      msg: invalidProfile.msg,
      dataShape: invalidProfile.dataShape,
      trace: invalidProfile.trace,
    }
    report.success = true
  } catch (error) {
    report.error = normalizeError(error)
  }

  return sanitizeValue(report)
}

const writeReport = async (report) => {
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(path.join(REPORT_DIR, 'auth-session-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const lines = [
    '# Live Auth Session Verification',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Base URL: ${report.baseUrl}`,
    `- Result: ${report.success ? 'PASS' : 'FAIL'}`,
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

  if (report.error) lines.push('## Error', '', `- ${report.error.name}: ${report.error.message}`, '')
  await writeFile(path.join(REPORT_DIR, 'auth-session-report.md'), `${lines.join('\n')}\n`, 'utf8')
}

const readConfig = () => ({
  baseUrl: normalizeBaseUrl(process.env.MANJU_API_BASE_URL || DEFAULT_BASE_URL),
  username: process.env.MANJU_USERNAME?.trim() ?? '',
  password: process.env.MANJU_PASSWORD ?? '',
  timeoutMs: Number.parseInt(process.env.MANJU_REQUEST_TIMEOUT_MS ?? '', 10) || DEFAULT_TIMEOUT_MS,
})

const main = async () => {
  const config = readConfig()
  if (!config.username || !config.password) {
    console.error('MANJU_USERNAME and MANJU_PASSWORD are required.')
    process.exitCode = 1
    return
  }

  const report = await runAuthSessionVerification(config)
  await writeReport(report)
  console.log(`Auth session verification: ${report.success ? 'PASS' : 'FAIL'}`)
  console.log('Report: artifacts/integration/auth-session-report.json')
  if (!report.success) process.exitCode = 1
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) await main()
