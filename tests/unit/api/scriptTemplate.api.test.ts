import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { scriptTemplateApi } from '@/api/scriptTemplate.api'
import { scriptTemplateApi as moduleScriptTemplateApi } from '@/api/modules/scriptTemplate'

describe('scriptTemplate api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('re-exports the module-level scriptTemplate api for compatibility', () => {
    expect(scriptTemplateApi).toBe(moduleScriptTemplateApi)
  })

  it('keeps template CRUD behavior through the compatibility entry', async () => {
    const created = await scriptTemplateApi.createTemplate({
      name: 'Template A',
      content: 'Body A',
    })

    const updated = await scriptTemplateApi.updateTemplate(created.id, {
      name: 'Template B',
      content: 'Body B',
    })

    expect(updated.name).toBe('Template B')

    await scriptTemplateApi.deleteTemplate(created.id)
    const templates = await scriptTemplateApi.getTemplates()
    expect(templates.some((template) => template.id === created.id)).toBe(false)
  })
})
