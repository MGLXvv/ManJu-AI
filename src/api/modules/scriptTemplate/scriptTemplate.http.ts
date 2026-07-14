import { http } from '@/api/http'
import { extractBackendEntity, extractBackendList } from '@/api/shared/backendPayload'
import { mapBackendScriptTemplate, type BackendScriptTemplateDTO } from './scriptTemplate.mapper'
import type { ScriptTemplateApiContract, ScriptTemplateInput } from './scriptTemplate.types'

const SCRIPT_TEMPLATES_PATH = '/script-templates'

/**
 * Phase1 exposes Script Template CRUD as a real catalog API.
 * The canonical page envelope is `data.list`; `template`/`templates` remain temporary aliases for older fixtures.
 */
export const scriptTemplateHttpApi: ScriptTemplateApiContract = {
  async getTemplates() {
    const { data } = await http.get(SCRIPT_TEMPLATES_PATH, {
      params: { pageNo: 1, pageSize: 100 },
    })
    return extractBackendList<BackendScriptTemplateDTO>(data, ['templates']).map(mapBackendScriptTemplate)
  },

  async createTemplate(input: ScriptTemplateInput) {
    const { data } = await http.post(SCRIPT_TEMPLATES_PATH, input)
    const template = extractBackendEntity<BackendScriptTemplateDTO>(data, ['template'])

    if (!template) {
      throw new Error('SCRIPT_TEMPLATE_CREATE_RESPONSE_INVALID')
    }

    return mapBackendScriptTemplate(template)
  },

  async updateTemplate(templateId: string, input: ScriptTemplateInput) {
    const { data } = await http.patch(`${SCRIPT_TEMPLATES_PATH}/${templateId}`, input)
    const template = extractBackendEntity<BackendScriptTemplateDTO>(data, ['template'])

    if (!template) {
      throw new Error('SCRIPT_TEMPLATE_UPDATE_RESPONSE_INVALID')
    }

    return mapBackendScriptTemplate(template)
  },

  async deleteTemplate(templateId: string) {
    await http.delete(`${SCRIPT_TEMPLATES_PATH}/${templateId}`)
  },
}
