import { afterEach, describe, expect, it, vi } from 'vitest'

describe.sequential('editorCapabilityState', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('keeps the complete editor workflow available in mock mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const { resolveEditorRouteCapability } = await import('@/features/editor/editorCapabilityState')

    expect(resolveEditorRouteCapability('editor-script-input')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-script-storyboard')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-settings')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-complete')).toEqual({ ok: true })
  })

  it('allows raw input but blocks unsupported persisted workflow routes in http mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const { resolveEditorRouteCapability } = await import('@/features/editor/editorCapabilityState')

    expect(resolveEditorRouteCapability('editor-script-input')).toEqual({ ok: true })
    expect(resolveEditorRouteCapability('editor-script-storyboard')).toMatchObject({
      ok: false,
      redirectRouteName: 'editor-script-input',
      capabilityKey: 'editor.script.generated.write',
    })
    expect(resolveEditorRouteCapability('editor-settings')).toMatchObject({
      ok: false,
      redirectRouteName: 'editor-script-input',
      capabilityKey: 'editor.setting.write',
    })
    expect(resolveEditorRouteCapability('editor-storyboard')).toMatchObject({
      ok: false,
      capabilityKey: 'editor.storyboard.write',
    })
    expect(resolveEditorRouteCapability('editor-video')).toMatchObject({
      ok: false,
      capabilityKey: 'editor.video.write',
    })
    expect(resolveEditorRouteCapability('editor-dubbing')).toMatchObject({
      ok: false,
      capabilityKey: 'editor.dubbing.write',
    })
    expect(resolveEditorRouteCapability('editor-complete')).toMatchObject({
      ok: false,
      capabilityKey: 'editor.dubbing.write',
    })
  })
})
