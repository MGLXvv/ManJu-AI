import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const SRC_ROOT = path.join(ROOT, 'src')
const read = (relativePath) => readFile(path.join(ROOT, relativePath), 'utf8')

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else files.push(absolute)
  }
  return files
}

const errors = []
const packageJson = JSON.parse(await read('package.json'))
const envExample = await read('.env.example')
const runtimeConfig = await read('src/config/runtimeConfig.ts')
const viteConfig = await read('vite.config.ts')
const httpClient = await read('src/api/http.ts')
const capabilityRegistry = await read('src/features/capabilities/capabilityRegistry.ts')
const workflow = await read('.github/workflows/frontend-ci.yml')

const runtimeEnvKeys = new Set(
  [...`${runtimeConfig}\n${viteConfig}`.matchAll(/(?:import\.meta\.env|env)\.(VITE_[A-Z0-9_]+)/g)].map((match) => match[1]),
)
const documentedEnvKeys = new Set(
  [...envExample.matchAll(/^\s*#?\s*(VITE_[A-Z0-9_]+)=/gm)].map((match) => match[1]),
)
for (const key of runtimeEnvKeys) {
  if (!documentedEnvKeys.has(key)) errors.push(`Environment variable ${key} is used but missing from .env.example.`)
}

if (!runtimeConfig.includes("'/admin-api'")) errors.push('runtimeConfig default API base must remain /admin-api.')
if (!viteConfig.includes("'/admin-api'")) errors.push('Vite proxy prefix must remain /admin-api.')
if (!httpClient.includes('baseURL: runtimeConfig.apiBaseUrl')) errors.push('Axios must use runtimeConfig.apiBaseUrl.')

const sourceFiles = (await walk(SRC_ROOT)).filter((file) => /\.(ts|tsx|vue)$/.test(file))
for (const file of sourceFiles.filter((item) => item.endsWith('.http.ts'))) {
  const source = await readFile(file, 'utf8')
  if (/['"]\/admin-api\//.test(source)) {
    errors.push(`${path.relative(ROOT, file)} hardcodes /admin-api; endpoints must be relative to the configured gateway base.`)
  }
}

const declaredCapabilities = new Set(
  [...capabilityRegistry.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map((match) => match[1]),
)
const capabilityUsePattern = /(?:resolveCapability|requireCapability|canUseCapability)\(\s*['"]([^'"]+)['"]/g
for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(capabilityUsePattern)) {
    const key = match[1]
    if (key && !declaredCapabilities.has(key)) {
      errors.push(`${path.relative(ROOT, file)} uses undeclared capability ${key}.`)
    }
  }
}

const exampleLine = envExample.match(/^# Example:\s*(.+)$/m)?.[1] ?? ''
for (const key of exampleLine.split(',').map((item) => item.trim()).filter(Boolean)) {
  if (!declaredCapabilities.has(key)) errors.push(`.env.example references undeclared capability ${key}.`)
}

const packageManager = String(packageJson.packageManager ?? '')
const pnpmVersion = packageManager.match(/^pnpm@(.+)$/)?.[1]
if (!pnpmVersion) errors.push('package.json packageManager must pin pnpm.')
else if (!workflow.includes(`corepack prepare pnpm@${pnpmVersion} --activate`)) {
  errors.push(`CI must activate pnpm@${pnpmVersion} from package.json.`)
}

const minimumNode = String(packageJson.engines?.node ?? '').match(/(\d+\.\d+\.\d+)/)?.[1]
if (!minimumNode) errors.push('package.json engines.node must contain a concrete minimum version.')
else if (!workflow.includes(`node-version: '${minimumNode}'`)) {
  errors.push(`CI node-version must match package.json minimum ${minimumNode}.`)
}

const requiredScripts = [
  'typecheck',
  'test',
  'build',
  'build:verify',
  'report:build',
  'test:e2e:mock',
  'check:http-mock-boundary',
  'check:integration-consistency',
  'check:source-assets',
  'check:source-hygiene',
  'check:build-budget',
  'check:static',
]
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) errors.push(`Missing package script: ${script}.`)
}

if (!workflow.includes('pnpm install --frozen-lockfile')) errors.push('CI must install from pnpm-lock.yaml with --frozen-lockfile.')
if (!workflow.includes('pnpm check:source-assets')) errors.push('CI must enforce source asset budgets.')
if (!workflow.includes('pnpm check:source-hygiene')) errors.push('CI must enforce source hygiene.')
if (!workflow.includes('pnpm build:verify')) errors.push('CI must build and verify production budgets.')
if (!workflow.includes('actions/cache@v4')) errors.push('CI must cache pnpm or Playwright downloads.')
if (!workflow.includes('frontend-build-report')) errors.push('CI must upload the frontend build report artifact.')
if (!workflow.includes('runs-on: windows-latest')) errors.push('CI must validate quality scripts on Windows.')
if (!workflow.includes('name: Windows quality scripts')) errors.push('CI must preserve the Windows quality scripts job name.')
if (!workflow.includes('run: pnpm check:static')) errors.push('Windows CI must run the static quality script suite.')

if (errors.length > 0) {
  console.error('Integration consistency check failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Integration consistency check passed: ${runtimeEnvKeys.size} env keys, ${declaredCapabilities.size} capabilities.`)
