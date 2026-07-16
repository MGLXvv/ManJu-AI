import { describe, expect, it, vi } from 'vitest'
import { createObjectUrlRegistry } from '@/features/shared/objectUrlRegistryState'

describe('objectUrlRegistryState', () => {
  it('tracks and releases a created object URL once', () => {
    const createObjectURL = vi.fn(() => 'blob:download-1')
    const revokeObjectURL = vi.fn()
    const registry = createObjectUrlRegistry({ createObjectURL, revokeObjectURL })
    const blob = new Blob(['payload'])

    const url = registry.create(blob)
    registry.release(url)
    registry.release(url)

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith(url)
  })

  it('releases every active URL and ignores already released entries', () => {
    const createObjectURL = vi.fn().mockReturnValueOnce('blob:download-1').mockReturnValueOnce('blob:download-2')
    const revokeObjectURL = vi.fn()
    const registry = createObjectUrlRegistry({ createObjectURL, revokeObjectURL })

    const first = registry.create(new Blob(['first']))
    registry.create(new Blob(['second']))
    registry.release(first)
    registry.releaseAll()
    registry.releaseAll()

    expect(revokeObjectURL).toHaveBeenCalledTimes(2)
    expect(revokeObjectURL).toHaveBeenNthCalledWith(1, 'blob:download-1')
    expect(revokeObjectURL).toHaveBeenNthCalledWith(2, 'blob:download-2')
  })
})
