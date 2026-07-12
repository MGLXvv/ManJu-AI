import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { chromium } from 'playwright'
import {
  ARTIFACT_DIR,
  BASE_URL,
  createProject,
  login,
  resetBrowserState,
  selectFirstProjectStyle,
  startMockServer,
} from './mock-e2e-runtime.mjs'

const UPDATE_BASELINES = process.argv.includes('--update')
const BASELINE_DIR = path.join(process.cwd(), 'tools', 'e2e', 'visual-baselines')
const VISUAL_ARTIFACT_DIR = path.join(ARTIFACT_DIR, 'visual')
const MAX_DIFF_RATIO = 0.01

const preparePage = async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.001ms !important;
        caret-color: transparent !important;
        transition-delay: 0s !important;
        transition-duration: 0.001ms !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(80)
}

const captureState = async (page, name) => {
  await preparePage(page)
  await mkdir(BASELINE_DIR, { recursive: true })
  await mkdir(VISUAL_ARTIFACT_DIR, { recursive: true })

  const actualPath = path.join(VISUAL_ARTIFACT_DIR, `${name}-actual.png`)
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`)
  await page.screenshot({ path: actualPath, animations: 'disabled', fullPage: false })

  if (UPDATE_BASELINES) {
    await copyFile(actualPath, baselinePath)
    return { name, status: 'updated', diffPixels: 0, diffRatio: 0 }
  }

  let expectedBuffer
  try {
    expectedBuffer = await readFile(baselinePath)
  } catch {
    throw new Error(`Missing visual baseline: ${path.relative(process.cwd(), baselinePath)}`)
  }

  const actualBuffer = await readFile(actualPath)
  const expected = PNG.sync.read(expectedBuffer)
  const actual = PNG.sync.read(actualBuffer)

  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `${name} dimensions changed from ${expected.width}x${expected.height} to ${actual.width}x${actual.height}.`,
    )
  }

  const diff = new PNG({ width: actual.width, height: actual.height })
  const diffPixels = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, {
    threshold: 0.12,
    includeAA: false,
  })
  const diffRatio = diffPixels / (actual.width * actual.height)

  if (diffRatio > MAX_DIFF_RATIO) {
    await copyFile(baselinePath, path.join(VISUAL_ARTIFACT_DIR, `${name}-expected.png`))
    await writeFile(path.join(VISUAL_ARTIFACT_DIR, `${name}-diff.png`), PNG.sync.write(diff))
    throw new Error(`${name} visual difference ${(diffRatio * 100).toFixed(3)}% exceeds 1.000%.`)
  }

  return { name, status: 'passed', diffPixels, diffRatio }
}

const writeReport = async (results) => {
  const generatedAt = new Date().toISOString()
  const report = { generatedAt, updateBaselines: UPDATE_BASELINES, maxDiffRatio: MAX_DIFF_RATIO, results }
  await mkdir(VISUAL_ARTIFACT_DIR, { recursive: true })
  await writeFile(path.join(VISUAL_ARTIFACT_DIR, 'visual-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  const markdown = [
    '# Visual Regression Report',
    '',
    `Generated: ${generatedAt}`,
    `Mode: ${UPDATE_BASELINES ? 'update' : 'compare'}`,
    '',
    ...results.map(
      (result) =>
        `- **${result.name}** — ${result.status} — ${(result.diffRatio * 100).toFixed(4)}% (${result.diffPixels} pixels)`,
    ),
    '',
  ].join('\n')
  await writeFile(path.join(VISUAL_ARTIFACT_DIR, 'visual-report.md'), `${markdown}\n`, 'utf8')
}

const server = startMockServer()
let browser
const results = []

try {
  await server.waitUntilReady()
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  await context.addInitScript(() => {
    Math.random = () => 0.3141592653589793
  })
  const page = await context.newPage()

  await resetBrowserState(page)
  results.push(await captureState(page, '01-login'))

  await login(page)
  results.push(await captureState(page, '02-project-list'))

  await page.getByRole('button', { name: '新建项目' }).click()
  const createDialog = page.getByRole('dialog', { name: '新建项目设置' })
  await createDialog.waitFor()
  results.push(await captureState(page, '03-create-project'))

  await createDialog.getByPlaceholder('请输入项目名称').fill('视觉回归项目')
  await createDialog.getByRole('button', { name: '横版 16:9' }).click()
  await selectFirstProjectStyle(page, createDialog)
  await createDialog.getByRole('button', { name: '关闭' }).click()
  await page.getByRole('alertdialog', { name: '确定放弃设置？' }).waitFor()
  results.push(await captureState(page, '04-confirm-dialog'))
  await page.getByRole('alertdialog', { name: '确定放弃设置？' }).getByRole('button', { name: '确定' }).click()

  await createProject(page, '视觉回归编辑器项目')
  results.push(await captureState(page, '05-script-input'))

  const textarea = page.locator('.script-input-panel__textarea')
  await textarea.fill('一个用于固定视觉回归状态的短篇故事。')
  await page.getByRole('button', { name: '生成剧本', exact: true }).click()
  await page
    .locator('.script-workbench-card__save-state')
    .getByText('已保存', { exact: true })
    .waitFor({ timeout: 15_000 })
  results.push(await captureState(page, '06-script-generated'))

  await page.goto(`${BASE_URL}/visual-regression-not-found`, { waitUntil: 'networkidle' })
  results.push(await captureState(page, '07-not-found'))

  await page.goto(`${BASE_URL}/projects/visual-regression-missing/unavailable`, { waitUntil: 'networkidle' })
  results.push(await captureState(page, '08-project-unavailable'))

  await writeReport(results)
  console.log(`Visual regression ${UPDATE_BASELINES ? 'baselines updated' : 'passed'} for ${results.length} states.`)
} catch (error) {
  await writeReport(results).catch(() => undefined)
  console.error(error)
  process.exitCode = 1
} finally {
  if (browser) await browser.close().catch(() => undefined)
  server.stop()
}
