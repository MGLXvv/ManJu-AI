import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ARTIFACT_DIR } from './mock-e2e-runtime.mjs'

export const scanAccessibility = async (page, pageName, scopeSelector = 'body') => {
  const violations = await page.evaluate(
    ({ label, selector }) => {
      const scope = document.querySelector(selector)
      if (!scope) {
        return [
          {
            impact: 'critical',
            rule: 'scan-scope-exists',
            message: `Accessibility scan scope was not found: ${selector}`,
            target: selector,
          },
        ]
      }

      const isVisible = (element) => {
        const style = window.getComputedStyle(element)
        return (
          !element.hidden &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          element.getClientRects().length > 0
        )
      }

      const textByIds = (ids) =>
        ids
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .filter(Boolean)
          .join(' ')

      const accessibleName = (element) => {
        const ariaLabel = element.getAttribute('aria-label')?.trim()
        if (ariaLabel) return ariaLabel

        const labelledBy = element.getAttribute('aria-labelledby')?.trim()
        if (labelledBy) return textByIds(labelledBy)

        if ('labels' in element && element.labels?.length) {
          const labels = [...element.labels].map((item) => item.textContent?.trim() ?? '').filter(Boolean)
          if (labels.length > 0) return labels.join(' ')
        }

        const title = element.getAttribute('title')?.trim()
        if (title) return title

        if (element instanceof HTMLInputElement && ['button', 'submit', 'reset'].includes(element.type)) {
          return element.value.trim()
        }

        return element.textContent?.trim() ?? ''
      }

      const targetFor = (element) => {
        if (element.id) return `#${element.id}`
        const className =
          typeof element.className === 'string' ? element.className.trim().split(/\s+/).filter(Boolean).join('.') : ''
        return `${element.tagName.toLowerCase()}${className ? `.${className}` : ''}`
      }

      const results = []
      const push = (impact, rule, message, element) =>
        results.push({ impact, rule, message: `${label}: ${message}`, target: targetFor(element) })

      for (const element of scope.querySelectorAll('button, a[href]')) {
        if (isVisible(element) && !accessibleName(element)) {
          push('serious', 'interactive-name', 'Visible interactive element has no accessible name.', element)
        }
      }

      for (const element of scope.querySelectorAll('input, select, textarea')) {
        if (!isVisible(element) || (element instanceof HTMLInputElement && element.type === 'hidden')) continue
        if (!accessibleName(element)) {
          push('serious', 'form-control-name', 'Visible form control has no associated label.', element)
        }
      }

      for (const element of scope.querySelectorAll('img')) {
        if (isVisible(element) && !element.hasAttribute('alt')) {
          push('serious', 'image-alt', 'Visible image is missing an alt attribute.', element)
        }
      }

      for (const element of scope.querySelectorAll('[role="dialog"], [role="alertdialog"]')) {
        if (isVisible(element) && !accessibleName(element)) {
          push('critical', 'dialog-name', 'Visible dialog has no accessible name.', element)
        }
      }

      for (const element of scope.querySelectorAll('[tabindex]')) {
        const value = Number(element.getAttribute('tabindex'))
        if (Number.isFinite(value) && value > 0) {
          push('serious', 'positive-tabindex', 'Positive tabindex changes the natural keyboard order.', element)
        }
      }

      const ids = new Map()
      for (const element of scope.querySelectorAll('[id]')) {
        if (!element.id) continue
        ids.set(element.id, (ids.get(element.id) ?? 0) + 1)
      }
      for (const [id, count] of ids) {
        if (count > 1) {
          results.push({
            impact: 'serious',
            rule: 'duplicate-id',
            message: `${label}: ID “${id}” appears ${count} times.`,
            target: `#${id}`,
          })
        }
      }

      return results
    },
    { label: pageName, selector: scopeSelector },
  )

  return { page: pageName, scope: scopeSelector, violations }
}

export const writeAccessibilityReport = async (results) => {
  const reportDirectory = path.join(ARTIFACT_DIR, 'accessibility')
  await mkdir(reportDirectory, { recursive: true })

  const violationCount = results.reduce((total, result) => total + result.violations.length, 0)
  const report = {
    generatedAt: new Date().toISOString(),
    blockedImpacts: ['critical', 'serious'],
    violationCount,
    results,
  }

  const markdown = [
    '# Accessibility Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Blocking violations: ${violationCount}`,
    '',
    ...results.flatMap((result) => [
      `## ${result.page}`,
      '',
      result.violations.length === 0
        ? 'No critical or serious baseline violations detected.'
        : result.violations
            .map(
              (violation) => `- **${violation.impact} / ${violation.rule}** ${violation.message} (${violation.target})`,
            )
            .join('\n'),
      '',
    ]),
  ].join('\n')

  await writeFile(path.join(reportDirectory, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(path.join(reportDirectory, 'report.md'), `${markdown}\n`, 'utf8')
  return report
}
