import { beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'

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

  it('throws a controlled error when creating templates in http mode', async () => {
    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    const error = await scriptTemplateHttpApi.createTemplate({
      name: 'Template A',
      content: 'Body A',
    }).catch((reason) => reason)

    expect(post).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when updating templates in http mode', async () => {
    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    const error = await scriptTemplateHttpApi.updateTemplate('template-1', {
      name: 'Template B',
      content: 'Body B',
    }).catch((reason) => reason)

    expect(patch).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
    })
  })

  it('throws a controlled error when deleting templates in http mode', async () => {
    const { scriptTemplateHttpApi } = await import('@/api/modules/scriptTemplate/scriptTemplate.http')

    const error = await scriptTemplateHttpApi.deleteTemplate('template-1').catch((reason) => reason)

    expect(del).not.toHaveBeenCalled()
    expect(error).toMatchObject({
      name: 'ApiError',
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
    })
  })
})
