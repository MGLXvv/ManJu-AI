import { assert, createProject, login, resetBrowserState } from '../mock-e2e-runtime.mjs'

export const editorPersistenceScenario = {
  name: 'editor-persistence',
  async run({ page }) {
    await resetBrowserState(page)
    await login(page)
    await createProject(page, 'CI 编辑器持久化项目')

    await page.getByText('自由编辑', { exact: true }).click()
    const textarea = page.locator('.script-input-panel__textarea')
    await textarea.waitFor()

    const persistedText = 'CI 自动保存与刷新恢复验证内容'
    await textarea.fill(persistedText)
    await page.getByRole('button', { name: '生成剧本', exact: true }).click()
    await page
      .locator('.script-workbench-card__save-state')
      .getByText('已保存', { exact: true })
      .waitFor({ timeout: 15_000 })

    const editorUrl = page.url()
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForURL(editorUrl)
    await page.locator('.script-step').waitFor()

    const restoredTextarea = page.locator('.script-input-panel__textarea')
    await restoredTextarea.waitFor()
    assert(
      (await restoredTextarea.inputValue()) === persistedText,
      'Saved script content was not restored after reload.',
    )
  },
}
