import { spawn, spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const PORT = Number(process.env.E2E_PORT || 4173)
export const BASE_URL = `http://127.0.0.1:${PORT}`
export const ARTIFACT_DIR = path.join(ROOT, 'artifacts', 'e2e')

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'

export const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

export const startMockServer = () => {
  const logs = []
  const server = spawn(command, ['exec', 'vite', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      VITE_API_MODE: 'mock',
      VITE_STRICT_RUNTIME_CONFIG: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })

  for (const stream of [server.stdout, server.stderr]) {
    stream?.on('data', (chunk) => logs.push(String(chunk)))
  }

  const waitUntilReady = async () => {
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

  const stop = () => {
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

  return { logs, stop, waitUntilReady }
}

export const resetBrowserState = async (page) => {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    localStorage.clear()
    sessionStorage.clear()
    if ('databases' in indexedDB) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(
          (database) =>
            database.name &&
            new Promise((resolve) => {
              const request = indexedDB.deleteDatabase(database.name)
              request.onsuccess = request.onerror = request.onblocked = () => resolve(undefined)
            }),
        ),
      )
    }
  })
  await page.reload({ waitUntil: 'networkidle' })
}

export const login = async (page, { keyboardSubmit = false } = {}) => {
  const username = page.locator('input:not([type="password"]):not([type="file"])').first()
  const password = page.locator('input[type="password"]')

  await username.fill('admin11')
  await password.fill('123456')
  if (keyboardSubmit) {
    await password.focus()
    await page.keyboard.press('Enter')
  } else {
    await page.locator('.auth-card__submit').click()
  }

  await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 })
  await page.getByRole('heading', { name: '我的项目' }).waitFor()
}

export const selectFirstProjectStyle = async (page, dialog) => {
  const styleSelect = dialog.locator('select')
  await page.waitForFunction(() => {
    const select = document.querySelector('.create-project-modal__select')
    return (
      select instanceof HTMLSelectElement &&
      !select.disabled &&
      [...select.options].some((option) => Boolean(option.value) && !option.disabled)
    )
  })

  const value = await styleSelect.locator('option:not([disabled])').first().getAttribute('value')
  assert(value, 'No enabled project style is available in Mock mode.')
  await styleSelect.selectOption(value)
}

export const createProject = async (page, name) => {
  await page.getByRole('button', { name: '新建项目' }).click()
  const dialog = page.getByRole('dialog', { name: '新建项目设置' })
  await dialog.waitFor()
  await dialog.getByPlaceholder('请输入项目名称').fill(name)
  await dialog.getByRole('button', { name: '横版 16:9' }).click()
  await selectFirstProjectStyle(page, dialog)
  await dialog.getByRole('button', { name: '创建项目' }).click()

  await page.waitForURL(/\/projects\/[^/]+\/editor\/script\/input$/, { timeout: 15_000 })
  await page.locator('.script-step').waitFor()
  const projectId = new URL(page.url()).pathname.split('/')[2]
  assert(projectId, 'Created project id was not present in the editor URL.')
  return projectId
}

export const readVersionedStorage = async (page, key) =>
  page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && 'schemaVersion' in parsed && 'value' in parsed
      ? parsed.value
      : parsed
  }, key)

export const writeScenarioFailure = async (page, scenarioName) => {
  await mkdir(ARTIFACT_DIR, { recursive: true })
  await page
    .screenshot({
      path: path.join(ARTIFACT_DIR, `${scenarioName}-failure.png`),
      fullPage: true,
    })
    .catch(() => undefined)
}
