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

  it('maps the canonical list envelope and pagination request', async () => {
    get.mockResolvedValue({
      data: {
        list: [
          {
            id: 11,
            name: 'Template A',
            content: 'Body A',
            updateTime: '2026-07-02T00:00:00.000Z',
          },
        ],
        total: 1,
      },
    })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')
    const templates = await scriptTemplateHttpApi.getTemplates()

    expect(get).toHaveBeenCalledWith('/script-templates', {
      params: { pageNo: 1, pageSize: 100 },
    })
    expect(templates).toEqual([
      {
        id: '11',
        name: 'Template A',
        content: 'Body A',
        updatedAt: '2026-07-02T00:00:00.000Z',
      },
    ])
  })

  it('keeps the legacy templates wrapper compatible', async () => {
    get.mockResolvedValue({ data: { templates: [{ id: 12, name: 'Legacy', content: 'Legacy body' }] } })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    await expect(scriptTemplateHttpApi.getTemplates()).resolves.toEqual([
      {
        id: '12',
        name: 'Legacy',
        content: 'Legacy body',
        updatedAt: '',
      },
    ])
  })

  it('creates templates from a direct backend entity', async () => {
    post.mockResolvedValue({
      data: {
        id: 11,
        name: 'Template A',
        content: 'Body A',
        updatedAt: '2026-07-02T00:00:00.000Z',
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
    expect(template.id).toBe('11')
  })

  it('rejects create and update responses without persisted template entities', async () => {
    post.mockResolvedValue({ data: null })
    patch.mockResolvedValue({ data: null })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    await expect(scriptTemplateHttpApi.createTemplate({ name: 'Template A', content: 'Body A' })).rejects.toThrow(
      'SCRIPT_TEMPLATE_CREATE_RESPONSE_INVALID',
    )
    await expect(
      scriptTemplateHttpApi.updateTemplate('template-1', { name: 'Template B', content: 'Body B' }),
    ).rejects.toThrow('SCRIPT_TEMPLATE_UPDATE_RESPONSE_INVALID')
  })

  it('updates templates through the legacy named wrapper', async () => {
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
    expect(template.updatedAt).toBe('2026-07-02T01:00:00.000Z')
  })

  it('deletes templates through the http api', async () => {
    del.mockResolvedValue({ data: {} })

    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    await scriptTemplateHttpApi.deleteTemplate('template-1')

    expect(del).toHaveBeenCalledWith('/script-templates/template-1')
  })
})
