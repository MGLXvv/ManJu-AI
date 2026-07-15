import { createPinia } from 'pinia'
import { createSSRApp, h, type Component } from 'vue'
import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'

const editorRouteNames = [
  'editor-script-input',
  'editor-settings',
  'editor-storyboard',
  'editor-video',
  'editor-dubbing',
  'editor-complete',
] as const

const renderNavigation = async (component: Component): Promise<string> => {
  const routes: RouteRecordRaw[] = editorRouteNames.map((name) => ({
    name,
    path: `/:projectId/${name}`,
    component: { render: () => null },
  }))
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push({
    name: 'editor-script-input',
    params: { projectId: 'project-1' },
  })
  await router.isReady()

  const app = createSSRApp({
    render: () => h(component),
  })
  app.use(createPinia())
  app.use(router)
  return renderToString(app)
}

describe.sequential('editor capability navigation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('renders unavailable HTTP stages as explained, accessible disabled links', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const [{ default: EditorSideNav }, { default: WorkflowStepper }] = await Promise.all([
      import('@/components/navigation/EditorSideNav.vue'),
      import('@/components/editor/WorkflowStepper.vue'),
    ])

    const sideNav = await renderNavigation(EditorSideNav)
    const stepper = await renderNavigation(WorkflowStepper)

    for (const html of [sideNav, stepper]) {
      expect(html).toContain('is-disabled')
      expect(html).toContain('aria-disabled="true"')
      expect(html).toContain('title="HTTP 模式尚未支持')
      expect(html).toContain('不可用：HTTP 模式尚未支持')
    }
  }, 15_000)

  it('keeps all navigation links enabled in mock mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const { default: EditorSideNav } = await import('@/components/navigation/EditorSideNav.vue')
    const html = await renderNavigation(EditorSideNav)

    expect(html).not.toContain('is-disabled')
    expect(html).not.toContain('aria-disabled="true"')
  })
})
