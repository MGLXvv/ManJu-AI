import { describe, expect, it } from 'vitest'
import { extractBackendEntity, extractBackendList } from '@/api/shared/backendPayload'

describe('backend payload extraction', () => {
  it('prefers the Integration Pack list envelope', () => {
    expect(extractBackendList<{ id: number }>({ list: [{ id: 1 }], total: 1 })).toEqual([{ id: 1 }])
  })

  it('supports legacy module wrappers during migration', () => {
    expect(extractBackendList<{ id: number }>({ voices: [{ id: 2 }] }, ['voices'])).toEqual([{ id: 2 }])
  })

  it('accepts direct arrays and returns an empty list for unknown shapes', () => {
    expect(extractBackendList<number>([1, 2])).toEqual([1, 2])
    expect(extractBackendList({ records: [{ id: 3 }] })).toEqual([])
    expect(extractBackendList(null)).toEqual([])
  })

  it('reads direct entities and legacy named wrappers', () => {
    expect(extractBackendEntity<{ id: number }>({ id: 1 })).toEqual({ id: 1 })
    expect(extractBackendEntity<{ id: number }>({ task: { id: 2 } }, ['task'])).toEqual({ id: 2 })
    expect(extractBackendEntity(null)).toBeNull()
    expect(extractBackendEntity([])).toBeNull()
  })
})
