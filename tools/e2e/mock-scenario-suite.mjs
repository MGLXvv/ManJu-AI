import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { writeAccessibilityReport } from './accessibility-scan.mjs'
import { ARTIFACT_DIR, startMockServer, writeScenarioFailure } from './mock-e2e-runtime.mjs'
import { accessibilityScenario } from './scenarios/accessibility.mjs'
import { authSessionScenario } from './scenarios/auth-session.mjs'
import { editorPersistenceScenario } from './scenarios/editor-persistence.mjs'
import { projectManagementScenario } from './scenarios/project-management.mjs'
import { runtimeRecoveryScenario } from './scenarios/runtime-recovery.mjs'

const scenarios = [
  authSessionScenario,
  projectManagementScenario,
  editorPersistenceScenario,
  runtimeRecoveryScenario,
  accessibilityScenario,
]

const scenarioResults = []
const accessibilityResults = []
const server = startMockServer()
let browser

const writeScenarioReport = async () => {
  await mkdir(ARTIFACT_DIR, { recursive: true })
  const generatedAt = new Date().toISOString()
  const failed = scenarioResults.filter((result) => result.status === 'failed')
  const report = { generatedAt, failed: failed.length, results: scenarioResults }
  const markdown = [
    '# Mock E2E Scenario Report',
    '',
    `Generated: ${generatedAt}`,
    `Scenarios: ${scenarioResults.length}`,
    `Failed: ${failed.length}`,
    '',
    ...scenarioResults.map(
      (result) =>
        `- **${result.name}** — ${result.status} (${result.durationMs} ms)${result.error ? ` — ${result.error}` : ''}`,
    ),
    '',
  ].join('\n')

  await writeFile(path.join(ARTIFACT_DIR, 'scenario-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(path.join(ARTIFACT_DIR, 'scenario-report.md'), `${markdown}\n`, 'utf8')
}

try {
  await server.waitUntilReady()
  browser = await chromium.launch({ headless: true })

  for (const scenario of scenarios) {
    const startedAt = Date.now()
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()

    try {
      await scenario.run({ page, accessibilityResults })
      if (scenario.name === 'accessibility') {
        const blocking = accessibilityResults.flatMap((result) => result.violations)
        if (blocking.length > 0) {
          throw new Error(`Accessibility baseline found ${blocking.length} critical or serious violation(s).`)
        }
      }
      scenarioResults.push({ name: scenario.name, status: 'passed', durationMs: Date.now() - startedAt })
      console.log(`Mock E2E scenario passed: ${scenario.name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      scenarioResults.push({ name: scenario.name, status: 'failed', durationMs: Date.now() - startedAt, error: message })
      await writeScenarioFailure(page, scenario.name)
      console.error(`Mock E2E scenario failed: ${scenario.name}: ${message}`)
    } finally {
      await context.close().catch(() => undefined)
    }
  }

  await writeAccessibilityReport(accessibilityResults)
  await writeScenarioReport()

  const failures = scenarioResults.filter((result) => result.status === 'failed')
  if (failures.length > 0) {
    if (server.logs.length > 0) {
      await writeFile(path.join(ARTIFACT_DIR, 'vite-server.log'), server.logs.join(''), 'utf8')
    }
    throw new Error(`${failures.length} Mock E2E scenario(s) failed: ${failures.map((result) => result.name).join(', ')}`)
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  if (browser) await browser.close().catch(() => undefined)
  server.stop()
}
