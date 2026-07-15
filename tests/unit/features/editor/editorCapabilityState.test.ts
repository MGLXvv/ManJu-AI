import { afterEach, describe, expect, it, vi } from 'vitest'

describe.sequential('editorCapabilityState', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('keeps the complete editor workflow available in mock mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const { buildEditorCapabilityAriaLabel, resolveEditorRouteCapability, resolveEditorRouteCapabilityView } =
      await import('@/features/editor/editorCapabilityState')

    expect(resolveEditorRouteCapability('editor-script-input')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-script-storyboard')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-settings')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-complete')).toEqual({ ok: true })

    const settings = resolveEditorRouteCapabilityView('editor-settings')
    expect(settings).toMatchObject({
      available: true,
      capabilityKey: 'editor.setting.write',
      status: 'mock-only',
      message: '',
    })
    expect(buildEditorCapabilityAriaLabel('设定', settings)).toBe('设定')
  })

  it('blocks unsupported routes and exposes accessible capability details in http mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const { buildEditorCapabilityAriaLabel, resolveEditorRouteCapability, resolveEditorRouteCapabilityView } =
      await import('@/features/editor/editorCapabilityState')

    expect(resolveEditorRouteCapability('editor-script-input')).toEqual({ ok: true })

    const expectedCapabilities = {
      'editor-script-storyboard': 'editor.script.generated.write',
      'editor-settings': 'editor.setting.write',
      'editor-storyboard': 'editor.storyboard.write',
      'editor-video': 'editor.video.write',
      'editor-dubbing': 'editor.dubbing.write',
      'editor-complete': 'editor.dubbing.write',
    } as const

    for (const [routeName, capabilityKey] of Object.entries(expectedCapabilities)) {
      const route = routeName as keyof typeof expectedCapabilities
      expect(resolveEditorRouteCapability(route)).toMatchObject({
        ok: false,
        redirectRouteName: 'editor-script-input',
        capabilityKey,
      })
      expect(resolveEditorRouteCapabilityView(route)).toMatchObject({
        available: false,
        capabilityKey,
        status: 'unsupported',
      })
    }

    const settings = resolveEditorRouteCapabilityView('editor-settings')
    const label = buildEditorCapabilityAriaLabel('设定', settings)
    expect(label).toContain('设定，不可用：')
    expect(label).toContain(settings.message)
  })
})
