import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { defaultScriptTemplates } from '@/mocks/scriptTemplate.mock'
import { scriptTemplateApi } from './scriptTemplate.api'

describe('modules/scriptTemplate scriptTemplateApi', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('returns default templates when local storage is empty', async () => {
    const templates = await scriptTemplateApi.getTemplates()
    expect(templates).toEqual(defaultScriptTemplates)
  })

  it('supports create, update, and delete lifecycle', async () => {
    const created = await scriptTemplateApi.createTemplate({
      name: ' New Template ',
      content: ' Content body ',
    })

    expect(created.name).toBe('New Template')
    expect(created.content).toBe('Content body')

    const updated = await scriptTemplateApi.updateTemplate(created.id, {
      name: 'Updated Name',
      content: 'Updated content',
    })

    expect(updated.name).toBe('Updated Name')
    expect(updated.content).toBe('Updated content')

    await scriptTemplateApi.deleteTemplate(created.id)
    const templates = await scriptTemplateApi.getTemplates()
    expect(templates.some((template) => template.id === created.id)).toBe(false)
  })
})
