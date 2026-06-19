import { http } from '@/api/http'
import type { ScriptTemplateApiContract, ScriptTemplateInput } from './scriptTemplate.types'

export const scriptTemplateHttpApi: ScriptTemplateApiContract = {
  async getTemplates() {
    const { data } = await http.get('/script-templates')
    return data.templates
  },

  async createTemplate(input: ScriptTemplateInput) {
    const { data } = await http.post('/script-templates', input)
    return data.template
  },

  async updateTemplate(templateId: string, input: ScriptTemplateInput) {
    const { data } = await http.patch(`/script-templates/${templateId}`, input)
    return data.template
  },

  async deleteTemplate(templateId: string) {
    await http.delete(`/script-templates/${templateId}`)
  },
}
