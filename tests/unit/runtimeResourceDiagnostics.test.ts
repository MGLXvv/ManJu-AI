import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getRuntimeResourceSnapshot,
  installRuntimeResourceDiagnostics,
  retainRuntimeResource,
  setRuntimeResourceCount,
} from '@/services/runtime/runtimeResourceDiagnostics'

describe('runtimeResourceDiagnostics', () => {
  beforeEach(() => {
    setRuntimeResourceCount('objectUrls', 0)
    setRuntimeResourceCount('timers', 0)
    setRuntimeResourceCount('subscriptions', 0)
    setRuntimeResourceCount('mountedEditors', 0)
  })

  afterEach(() => {
    delete window.__MANJU_DIAGNOSTICS__
    vi.restoreAllMocks()
  })

  it('tracks retained resources and releases them once', () => {
    const release = retainRuntimeResource('mountedEditors')
    expect(getRuntimeResourceSnapshot().mountedEditors).toBe(1)

    release()
    release()

    expect(getRuntimeResourceSnapshot().mountedEditors).toBe(0)
  })

  it('clamps direct resource counts at zero', () => {
    setRuntimeResourceCount('objectUrls', 3.9)
    expect(getRuntimeResourceSnapshot().objectUrls).toBe(3)

    setRuntimeResourceCount('objectUrls', -10)
    expect(getRuntimeResourceSnapshot().objectUrls).toBe(0)
  })

  it('exposes object url probes through the diagnostics bridge', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:diagnostic-probe')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const uninstall = installRuntimeResourceDiagnostics()

    const url = window.__MANJU_DIAGNOSTICS__?.createObjectUrlProbe()
    expect(url).toBe('blob:diagnostic-probe')
    expect(window.__MANJU_DIAGNOSTICS__?.snapshot().objectUrls).toBe(1)

    window.__MANJU_DIAGNOSTICS__?.revokeObjectUrlProbe(url ?? '')
    expect(window.__MANJU_DIAGNOSTICS__?.snapshot().objectUrls).toBe(0)
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:diagnostic-probe')

    uninstall()
    expect(window.__MANJU_DIAGNOSTICS__).toBeUndefined()
  })
})
