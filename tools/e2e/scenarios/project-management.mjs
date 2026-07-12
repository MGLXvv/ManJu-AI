import {
  assert,
  login,
  readVersionedStorage,
  resetBrowserState,
  selectFirstProjectStyle,
} from '../mock-e2e-runtime.mjs'

export const projectManagementScenario = {
  name: 'project-management',
  async run({ page }) {
    await resetBrowserState(page)
    await login(page)

    const trigger = page.getByRole('button', { name: '新建项目' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: '新建项目设置' })
    await dialog.waitFor()
    await page.waitForFunction(() => document.activeElement?.classList.contains('create-project-modal__input'))

    const submit = dialog.getByRole('button', { name: '创建项目' })
    await page.waitForFunction(() => {
      const select = document.querySelector('.create-project-modal__select')
      return select instanceof HTMLSelectElement && !select.disabled
    })

    await submit.focus()
    await page.keyboard.press('Tab')
    const focusStayedInside = await dialog.evaluate((element) => element.contains(document.activeElement))
    assert(focusStayedInside, 'Tab focus escaped the create project dialog.')

    await submit.click()
    await dialog.getByText('请输入项目名称').waitFor()
    assert(
      (await dialog.getByPlaceholder('请输入项目名称').getAttribute('aria-invalid')) === 'true',
      'Project name validation was not exposed through aria-invalid.',
    )
    await page.waitForFunction(() => document.activeElement?.classList.contains('create-project-modal__input'))

    await dialog.getByPlaceholder('请输入项目名称').fill('CI 可访问性项目')
    await dialog.getByRole('button', { name: '横版 16:9' }).click()
    assert(
      (await dialog.getByRole('button', { name: '横版 16:9' }).getAttribute('aria-pressed')) === 'true',
      'Selected project ratio was not exposed through aria-pressed.',
    )
    await selectFirstProjectStyle(page, dialog)

    await page.keyboard.press('Escape')
    const confirmDialog = page.getByRole('alertdialog', { name: '确定放弃设置？' })
    await confirmDialog.waitFor()
    const nestedFocusStayedInside = await confirmDialog.evaluate((element) => element.contains(document.activeElement))
    assert(nestedFocusStayedInside, 'Nested confirmation dialog did not receive focus.')

    await page.keyboard.press('Escape')
    await confirmDialog.waitFor({ state: 'hidden' })
    await dialog.waitFor()

    await submit.click()
    await page.waitForURL(/\/projects\/[^/]+\/editor\/script\/input$/, { timeout: 15_000 })
    await page.locator('.script-step').waitFor()

    const projectId = new URL(page.url()).pathname.split('/')[2]
    assert(projectId, 'Created project id was not present in the editor URL.')
    const projects = await readVersionedStorage(page, 'amd.projects')
    assert(
      Array.isArray(projects) &&
        projects.some((project) => project.id === projectId && project.name === 'CI 可访问性项目'),
      'Created project was not persisted in versioned Mock storage.',
    )
  },
}
