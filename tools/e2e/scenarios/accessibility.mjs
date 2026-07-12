import { scanAccessibility } from '../accessibility-scan.mjs'
import { BASE_URL, login, resetBrowserState } from '../mock-e2e-runtime.mjs'

export const accessibilityScenario = {
  name: 'accessibility',
  async run({ page, accessibilityResults }) {
    await resetBrowserState(page)
    accessibilityResults.push(await scanAccessibility(page, '登录页'))

    await login(page, { keyboardSubmit: true })
    accessibilityResults.push(await scanAccessibility(page, '项目列表'))

    await page.getByRole('button', { name: '新建项目' }).click()
    const dialog = page.getByRole('dialog', { name: '新建项目设置' })
    await dialog.waitFor()
    accessibilityResults.push(await scanAccessibility(page, '新建项目弹窗', '.create-project-modal__dialog'))
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })

    await page.goto(`${BASE_URL}/missing-accessibility-page`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '页面不存在' }).waitFor()
    accessibilityResults.push(await scanAccessibility(page, '404 页面'))
  },
}
