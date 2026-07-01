import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { scriptTemplateApiMock } = vi.hoisted(() => ({
  scriptTemplateApiMock: {
    getTemplates: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
  },
}))

vi.mock('@/api/scriptTemplate.api', () => ({
  scriptTemplateApi: scriptTemplateApiMock,
}))

describe('script template store phase1 compat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    Object.values(scriptTemplateApiMock).forEach((fn) => fn.mockReset())
    vi.resetModules()
  })

  it('loads safely when http mode returns an empty template list', async () => {
    scriptTemplateApiMock.getTemplates.mockResolvedValue([])
    const { useScriptTemplateStore } = await import('@/stores/scriptTemplates')

    const store = useScriptTemplateStore()
    await store.loadTemplates()

    expect(store.templates).toEqual([])
    expect(store.loaded).toBe(true)
    expect(store.loading).toBe(false)
  })
})
