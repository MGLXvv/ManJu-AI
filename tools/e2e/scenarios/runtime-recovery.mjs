import { BASE_URL, assert, login, resetBrowserState } from '../mock-e2e-runtime.mjs'

export const runtimeRecoveryScenario = {
  name: 'runtime-recovery',
  async run({ page }) {
    await resetBrowserState(page)
    await login(page)

    await page.goto(`${BASE_URL}/missing-page`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '页面不存在' }).waitFor()

    await page.goto(`${BASE_URL}/projects/nonexistent/unavailable`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '项目暂时无法打开' }).waitFor()

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.evaluate(() => localStorage.setItem('amd.projects', '{invalid-json'))
    await page.reload({ waitUntil: 'networkidle' })

    const recoveryDialog = page.getByRole('alertdialog', { name: '页面遇到了一些问题' })
    await recoveryDialog.waitFor()
    assert(
      await recoveryDialog.getByText(/已隔离 1 项损坏的本地数据/).isVisible(),
      'Corrupted local storage was not surfaced through the recovery panel.',
    )

    await recoveryDialog.getByRole('button', { name: '清理损坏缓存' }).click()
    await page.getByRole('heading', { name: '我的项目' }).waitFor({ timeout: 15_000 })
    await recoveryDialog.waitFor({ state: 'hidden' })
  },
}
