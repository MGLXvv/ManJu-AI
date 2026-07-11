import { spawn, spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const PORT = Number(process.env.E2E_PORT || 4173)
const BASE_URL = `http://127.0.0.1:${PORT}`
const ARTIFACT_DIR = path.join(ROOT, 'artifacts', 'e2e')
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const serverLogs = []

const server = spawn(
  command,
  ['exec', 'vite', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  {
    cwd: ROOT,
    env: {
      ...process.env,
      VITE_API_MODE: 'mock',
      VITE_STRICT_RUNTIME_CONFIG: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  },
)

for (const stream of [server.stdout, server.stderr]) {
  stream?.on('data', (chunk) => serverLogs.push(String(chunk)))
}

const waitForServer = async () => {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Vite exited early with code ${server.exitCode}.`)
    try {
      const response = await fetch(BASE_URL)
      if (response.ok) return
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Vite did not become ready at ${BASE_URL}.`)
}

const stopServer = () => {
  if (!server.pid || server.exitCode !== null) return
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-server.pid, 'SIGTERM')
  } catch {
    server.kill('SIGTERM')
  }
}

let browser
let page

try {
  await waitForServer()
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await context.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    localStorage.clear()
    sessionStorage.clear()
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases()
      await Promise.all(databases.map((database) => database.name && new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(database.name)
        request.onsuccess = request.onerror = request.onblocked = () => resolve(undefined)
      })))
    }
  })
  await page.reload({ waitUntil: 'networkidle' })

  await page.locator('input:not([type="password"]):not([type="file"])').first().fill('admin11')
  await page.locator('input[type="password"]').fill('123456')
  await page.locator('.auth-card__submit').click()
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })
  await page.getByRole('heading', { name: '我的项目' }).waitFor()

  await page.getByRole('button', { name: '新建项目' }).click()
  const dialog = page.getByRole('dialog', { name: '新建项目设置' })
  await dialog.waitFor()
  await dialog.getByPlaceholder('请输入项目名称').fill('CI Mock 主流程项目')
  await dialog.getByRole('button', { name: '横版 16:9' }).click()

  const styleSelect = dialog.locator('select')
  const styleValue = await styleSelect.locator('option:not([disabled])').first().getAttribute('value')
  if (!styleValue) throw new Error('No enabled project style is available in Mock mode.')
  await styleSelect.selectOption(styleValue)
  await dialog.getByRole('button', { name: '创建项目' }).click()

  await page.waitForURL(/\/projects\/[^/]+\/editor\/script\/input$/, { timeout: 15_000 })
  await page.locator('.script-step').waitFor()
  const editorUrl = page.url()
  const projectId = new URL(editorUrl).pathname.split('/')[2]
  if (!projectId) throw new Error('Created project id was not present in the editor URL.')

  const persisted = await page.evaluate((id) => {
    const raw = localStorage.getItem('amd.projects')
    return Boolean(raw && JSON.parse(raw).some((project) => project.id === id && project.name === 'CI Mock 主流程项目'))
  }, projectId)
  if (!persisted) throw new Error('Created project was not persisted to Mock storage.')

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForURL(editorUrl)
  await page.locator('.script-step').waitFor()

  console.log(`Playwright Mock main flow passed for project ${projectId}.`)
} catch (error) {
  await mkdir(ARTIFACT_DIR, { recursive: true })
  if (page) {
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'mock-main-flow-failure.png'),
      fullPage: true,
    }).catch(() => undefined)
  }
  console.error(error)
  if (serverLogs.length > 0) console.error(serverLogs.join(''))
  process.exitCode = 1
} finally {
  await browser?.close().catch(() => undefined)
  stopServer()
}
