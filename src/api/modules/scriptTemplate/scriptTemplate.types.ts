import type { ScriptTemplate, ScriptTemplateInput } from '@/types/scriptTemplate'

export type { ScriptTemplate, ScriptTemplateInput } from '@/types/scriptTemplate'

export interface ScriptTemplateApiContract {
  getTemplates(): Promise<ScriptTemplate[]>
  createTemplate(input: ScriptTemplateInput): Promise<ScriptTemplate>
  updateTemplate(templateId: string, input: ScriptTemplateInput): Promise<ScriptTemplate>
  deleteTemplate(templateId: string): Promise<void>
}
