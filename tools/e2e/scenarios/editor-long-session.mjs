import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ARTIFACT_DIR, BASE_URL, assert, createProject, login, resetBrowserState } from '../mock-e2e-runtime.mjs'

const ITERATIONS = 35
const MAX_HEAP_GROWTH_BYTES = 24 * 1024 * 1024
const MAX_NODE_GROWTH = 1000
const MAX_LISTENER_GROWTH = 200
const MAX_DOCUMENT_GROWTH = 5

const readPerformanceMetrics = async (session) => {
  const response = await session.send('Performance.getMetrics')
  return Object.fromEntries(response.metrics.map((metric) => [metric.name, metric.value]))
}

const average = (values) => values.reduce((total, value) => total + value, 0) / Math.max(values.length, 1)

const writePerformanceReport = async (report) => {
  const directory = path.join(ARTIFACT_DIR, 'performance')
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, 'editor-long-session.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')

  const markdown = [
    '# Editor Long Session Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Iterations: ${report.iterations}`,
    `Heap delta: ${report.deltas.heapBytes} bytes`,
    `DOM node delta: ${report.deltas.nodes}`,
    `Event listener delta: ${report.deltas.eventListeners}`,
    `Document delta: ${report.deltas.documents}`,
    `First five average: ${report.timings.firstFiveAverageMs.toFixed(2)} ms`,
    `Last five average: ${report.timings.lastFiveAverageMs.toFixed(2)} ms`,
    '',
    '## Resource snapshots',
    '',
    `- Start: ${JSON.stringify(report.resources.start)}`,
    `- End: ${JSON.stringify(report.resources.end)}`,
    '',
  ].join('\n')

  await writeFile(path.join(directory, 'editor-long-session.md'), `${markdown}\n`, 'utf8')
}

export const editorLongSessionScenario = {
  name: 'editor-long-session',
  async run({ page }) {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') pageErrors.push(message.text())
    })

    await resetBrowserState(page)
    await login(page)
    const projectId = await createProject(page, 'CI 长会话性能项目')
    const editorUrl = `${BASE_URL}/projects/${projectId}/editor/script/input`

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '我的项目' }).waitFor()

    const diagnosticsAvailable = await page.evaluate(() => Boolean(window.__MANJU_DIAGNOSTICS__))
    assert(diagnosticsAvailable, 'Runtime diagnostics bridge is not available in Mock E2E mode.')

    const startResources = await page.evaluate(() => window.__MANJU_DIAGNOSTICS__?.snapshot())
    assert(startResources, 'Unable to capture the starting resource snapshot.')

    const session = await page.context().newCDPSession(page)
    await session.send('Performance.enable')
    const startMetrics = await readPerformanceMetrics(session)
    const iterationDurations = []

    for (let index = 0; index < ITERATIONS; index += 1) {
      const startedAt = performance.now()
      await page.goto(editorUrl, { waitUntil: 'domcontentloaded' })
      await page.locator('.script-step').waitFor()

      await page.evaluate(() => {
        const diagnostics = window.__MANJU_DIAGNOSTICS__
        const url = diagnostics?.createObjectUrlProbe() ?? ''
        if (url) diagnostics?.revokeObjectUrlProbe(url)
      })

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: '我的项目' }).waitFor()
      iterationDurations.push(performance.now() - startedAt)
    }

    await page.evaluate(() => new Promise((resolve) => window.setTimeout(resolve, 100)))
    const endResources = await page.evaluate(() => window.__MANJU_DIAGNOSTICS__?.snapshot())
    assert(endResources, 'Unable to capture the ending resource snapshot.')

    const endMetrics = await readPerformanceMetrics(session)
    const deltas = {
      heapBytes: Math.round((endMetrics.JSHeapUsedSize ?? 0) - (startMetrics.JSHeapUsedSize ?? 0)),
      nodes: Math.round((endMetrics.Nodes ?? 0) - (startMetrics.Nodes ?? 0)),
      eventListeners: Math.round((endMetrics.JSEventListeners ?? 0) - (startMetrics.JSEventListeners ?? 0)),
      documents: Math.round((endMetrics.Documents ?? 0) - (startMetrics.Documents ?? 0)),
    }
    const firstFiveAverageMs = average(iterationDurations.slice(0, 5))
    const lastFiveAverageMs = average(iterationDurations.slice(-5))

    const report = {
      generatedAt: new Date().toISOString(),
      iterations: ITERATIONS,
      resources: { start: startResources, end: endResources },
      metrics: { start: startMetrics, end: endMetrics },
      deltas,
      timings: {
        allMs: iterationDurations,
        firstFiveAverageMs,
        lastFiveAverageMs,
      },
      pageErrors,
    }

    await writePerformanceReport(report)

    assert(
      endResources.objectUrls === startResources.objectUrls,
      'Object URL count did not return to the starting baseline.',
    )
    assert(
      endResources.mountedEditors === startResources.mountedEditors,
      'Mounted editor count did not return to the starting baseline.',
    )
    assert(endResources.timers === startResources.timers, 'Tracked timer count did not return to the starting baseline.')
    assert(
      endResources.subscriptions === startResources.subscriptions,
      'Tracked subscription count did not return to the starting baseline.',
    )
    assert(deltas.heapBytes <= MAX_HEAP_GROWTH_BYTES, `Heap grew by ${deltas.heapBytes} bytes.`)
    assert(deltas.nodes <= MAX_NODE_GROWTH, `DOM node count grew by ${deltas.nodes}.`)
    assert(deltas.eventListeners <= MAX_LISTENER_GROWTH, `Event listener count grew by ${deltas.eventListeners}.`)
    assert(deltas.documents <= MAX_DOCUMENT_GROWTH, `Document count grew by ${deltas.documents}.`)
    assert(
      lastFiveAverageMs <= Math.max(firstFiveAverageMs * 2.25, firstFiveAverageMs + 1000),
      `Editor navigation degraded from ${firstFiveAverageMs.toFixed(2)} ms to ${lastFiveAverageMs.toFixed(2)} ms.`,
    )
    assert(pageErrors.length === 0, `Long session emitted console or page errors: ${pageErrors.join(' | ')}`)
  },
}
