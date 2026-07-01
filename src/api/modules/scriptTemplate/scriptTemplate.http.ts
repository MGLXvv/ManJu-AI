import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { ScriptTemplateApiContract, ScriptTemplateInput } from './scriptTemplate.types'

export const scriptTemplateHttpApi: ScriptTemplateApiContract = {
  async getTemplates() {
    const { data } = await http.get('/script-templates')
    return Array.isArray(data.templates) ? data.templates : []
  },

  async createTemplate(_input: ScriptTemplateInput) {
    throw createApiError({
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
      message: 'Script template write operations are not available in the current HTTP phase.',
    })
  },

  async updateTemplate(_templateId: string, _input: ScriptTemplateInput) {
    throw createApiError({
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
      message: 'Script template write operations are not available in the current HTTP phase.',
    })
  },

  async deleteTemplate(_templateId: string) {
    throw createApiError({
      code: API_ERROR_CODES.scriptTemplateHttpWriteUnsupported,
      message: 'Script template write operations are not available in the current HTTP phase.',
    })
  },
}
