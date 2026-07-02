import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    patch,
    delete: del,
  },
}))

describe('scriptTemplateHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('normalizes lightweight script template payloads to an empty list', async () => {
    get.mockResolvedValue({
      data: {},
    })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')
    const templates = await scriptTemplateHttpApi.getTemplates()

    expect(get).toHaveBeenCalledWith('/script-templates')
    expect(templates).toEqual([])
  })

  it('creates templates through the http api', async () => {
    post.mockResolvedValue({
      data: {
        template: {
          id: 11,
          name: 'Template A',
          content: 'Body A',
          updatedAt: '2026-07-02T00:00:00.000Z',
        },
      },
    })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    const template = await scriptTemplateHttpApi.createTemplate({
      name: 'Template A',
      content: 'Body A',
    })

    expect(post).toHaveBeenCalledWith('/script-templates', {
      name: 'Template A',
      content: 'Body A',
    })
    expect(template).toEqual({
      id: '11',
      name: 'Template A',
      content: 'Body A',
      updatedAt: '2026-07-02T00:00:00.000Z',
    })
  })

  it('updates templates through the http api', async () => {
    patch.mockResolvedValue({
      data: {
        template: {
          id: 11,
          name: 'Template B',
          content: 'Body B',
          updateTime: '2026-07-02T01:00:00.000Z',
        },
      },
    })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    const template = await scriptTemplateHttpApi.updateTemplate('template-1', {
      name: 'Template B',
      content: 'Body B',
    })

    expect(patch).toHaveBeenCalledWith('/script-templates/template-1', {
      name: 'Template B',
      content: 'Body B',
    })
    expect(template).toEqual({
      id: '11',
      name: 'Template B',
      content: 'Body B',
      updatedAt: '2026-07-02T01:00:00.000Z',
    })
  })

  it('deletes templates through the http api', async () => {
    del.mockResolvedValue({
      data: {},
    })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    await scriptTemplateHttpApi.deleteTemplate('template-1')

    expect(del).toHaveBeenCalledWith('/script-templates/template-1')
  })
})
