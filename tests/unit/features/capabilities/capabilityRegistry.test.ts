import { afterEach, describe, expect, it, vi } from 'vitest'

describe.sequential('capabilityRegistry', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('allows mock-only project transfer in mock mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.import')).toMatchObject({
      status: 'mock-only',
      available: true,
      source: 'default',
    })
    expect(resolveCapability('auth.register').available).toBe(false)
  })

  it('enables Phase1 real catalogs and task controls in http mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('resource.write')).toMatchObject({
      status: 'available',
      available: true,
    })
    expect(resolveCapability('voice.write')).toMatchObject({
      status: 'available',
      available: true,
    })
    expect(resolveCapability('generation.cancel').available).toBe(true)
    expect(resolveCapability('generation.retry').available).toBe(true)
  })

  it('keeps controlled rejects and semantic mismatches disabled', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.import')).toMatchObject({
      status: 'unsupported',
      available: false,
    })
    expect(resolveCapability('project.export')).toMatchObject({
      status: 'unsupported',
      available: false,
    })
    expect(resolveCapability('system.write')).toMatchObject({
      status: 'readonly',
      available: false,
    })
  })

  it('allows environment overrides only for explicitly overridable capabilities', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_ENABLED_CAPABILITIES', 'resource.write')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('resource.write')).toMatchObject({
      status: 'available',
      available: true,
      source: 'enabled-override',
    })
  })

  it('rejects an environment override for controlled-reject capabilities', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_ENABLED_CAPABILITIES', 'project.import')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.import')).toMatchObject({
      status: 'unsupported',
      available: false,
      source: 'override-rejected',
    })
  })

  it('lets disabled configuration override enabled configuration', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_ENABLED_CAPABILITIES', 'resource.write')
    vi.stubEnv('VITE_DISABLED_CAPABILITIES', 'resource.write')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('resource.write')).toMatchObject({
      available: false,
      source: 'disabled-override',
    })
  })
})
