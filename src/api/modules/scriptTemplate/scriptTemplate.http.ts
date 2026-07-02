import { http } from '@/api/http'
import type { ScriptTemplate, ScriptTemplateApiContract, ScriptTemplateInput } from './scriptTemplate.types'

const normalizeTemplate = (value: unknown): ScriptTemplate => {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

  return {
    id: String(record.id ?? ''),
    name: typeof record.name === 'string' ? record.name : '',
    content: typeof record.content === 'string' ? record.content : '',
    updatedAt:
      typeof record.updatedAt === 'string'
        ? record.updatedAt
        : typeof record.updateTime === 'string'
          ? record.updateTime
          : typeof record.createTime === 'string'
            ? record.createTime
            : '',
  }
}

export const scriptTemplateHttpApi: ScriptTemplateApiContract = {
  async getTemplates() {
    const { data } = await http.get('/script-templates')
    return Array.isArray(data.templates) ? data.templates.map(normalizeTemplate) : []
  },

  async createTemplate(input: ScriptTemplateInput) {
    const { data } = await http.post('/script-templates', input)
    return normalizeTemplate(data.template)
  },

  async updateTemplate(templateId: string, input: ScriptTemplateInput) {
    const { data } = await http.patch(`/script-templates/${templateId}`, input)
    return normalizeTemplate(data.template)
  },

  async deleteTemplate(templateId: string) {
    await http.delete(`/script-templates/${templateId}`)
  },
}
