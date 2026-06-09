import { defaultScriptTemplates } from '@/mocks/scriptTemplate.mock'
import type { ScriptTemplate, ScriptTemplateInput } from '@/types/scriptTemplate'
import { delay, readLocal, writeLocal } from './local'

const SCRIPT_TEMPLATE_KEY = 'amd.script.templates'

const cloneTemplate = (template: ScriptTemplate): ScriptTemplate => ({
  ...template,
})

const normalizeTemplates = (templates?: ScriptTemplate[]): ScriptTemplate[] => {
  if (!templates?.length) {
    return defaultScriptTemplates.map(cloneTemplate)
  }

  return templates.map((template) => ({
    ...template,
    updatedAt: template.updatedAt || new Date().toISOString(),
  }))
}

const getTemplateList = (): ScriptTemplate[] => readLocal<ScriptTemplate[]>(SCRIPT_TEMPLATE_KEY, [])
const setTemplateList = (templates: ScriptTemplate[]): void => writeLocal(SCRIPT_TEMPLATE_KEY, templates)

export const scriptTemplateApi = {
  async getTemplates(): Promise<ScriptTemplate[]> {
    await delay()
    const normalized = normalizeTemplates(getTemplateList())
    setTemplateList(normalized)
    return normalized.map(cloneTemplate)
  },

  async createTemplate(input: ScriptTemplateInput): Promise<ScriptTemplate> {
    await delay(80)
    const templates = normalizeTemplates(getTemplateList())
    const nextTemplate: ScriptTemplate = {
      id: `script-template-${crypto.randomUUID()}`,
      name: input.name.trim(),
      content: input.content.trim(),
      updatedAt: new Date().toISOString(),
    }
    templates.unshift(nextTemplate)
    setTemplateList(templates)
    return cloneTemplate(nextTemplate)
  },

  async updateTemplate(templateId: string, input: ScriptTemplateInput): Promise<ScriptTemplate> {
    await delay(80)
    const templates = normalizeTemplates(getTemplateList())
    const targetIndex = templates.findIndex((template) => template.id === templateId)

    if (targetIndex < 0) {
      throw new Error('SCRIPT_TEMPLATE_NOT_FOUND')
    }

    const nextTemplate: ScriptTemplate = {
      ...templates[targetIndex],
      name: input.name.trim(),
      content: input.content.trim(),
      updatedAt: new Date().toISOString(),
    }
    templates.splice(targetIndex, 1, nextTemplate)
    setTemplateList(templates)
    return cloneTemplate(nextTemplate)
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await delay(80)
    const templates = normalizeTemplates(getTemplateList()).filter((template) => template.id !== templateId)
    setTemplateList(templates)
  },
}
