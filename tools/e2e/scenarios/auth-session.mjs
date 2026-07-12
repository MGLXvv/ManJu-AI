import { BASE_URL, assert, login, resetBrowserState } from '../mock-e2e-runtime.mjs'

export const authSessionScenario = {
  name: 'auth-session',
  async run({ page }) {
    await resetBrowserState(page)
    await page.goto(`${BASE_URL}/projects/missing/editor/script/input`, { waitUntil: 'networkidle' })
    await page.waitForURL((url) => url.pathname === '/login')

    await login(page, { keyboardSubmit: true })
    await page.reload({ waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: '我的项目' }).waitFor()

    assert(new URL(page.url()).pathname === '/', 'Authenticated session was not restored after reload.')
  },
}
