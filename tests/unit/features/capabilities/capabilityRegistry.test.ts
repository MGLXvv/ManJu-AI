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

  it('blocks unverified http capabilities by default', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.export')).toMatchObject({
      status: 'unsupported',
      available: false,
    })
    expect(resolveCapability('resource.write')).toMatchObject({
      status: 'readonly',
      available: false,
    })
  })

  it('enables verified capabilities through runtime configuration', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_ENABLED_CAPABILITIES', 'project.import,generation.cancel')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.import')).toMatchObject({
      status: 'available',
      available: true,
      source: 'enabled-override',
    })
    expect(resolveCapability('generation.cancel').available).toBe(true)
  })

  it('lets disabled configuration override enabled configuration', async () => {
    vi.stubEnv('VITE_API_MODE', 'http')
    vi.stubEnv('VITE_ENABLED_CAPABILITIES', 'project.export')
    vi.stubEnv('VITE_DISABLED_CAPABILITIES', 'project.export')
    const { resolveCapability } = await import('@/features/capabilities/capabilityRegistry')

    expect(resolveCapability('project.export')).toMatchObject({
      available: false,
      source: 'disabled-override',
    })
  })
})
