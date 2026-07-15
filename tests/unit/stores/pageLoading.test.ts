import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePageLoadingStore } from '@/stores/pageLoading'

describe('pageLoading store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('ignores completion from an older navigation token', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(160)
    const loading = usePageLoadingStore()

    const firstToken = loading.begin('first')
    const secondToken = loading.begin('second')

    loading.end(firstToken)
    expect(loading.visible).toBe(true)
    expect(loading.message).toBe('second')
    expect(loading.startedAt).toBe(160)

    loading.end(secondToken)
    expect(loading.visible).toBe(false)
  })
})
