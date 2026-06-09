import type { ScriptTemplate, ScriptTemplateInput } from '@/types/scriptTemplate'

export interface ScriptTemplateFormErrors {
  name?: string
  content?: string
}

export const createEmptyScriptTemplateInput = (): ScriptTemplateInput => ({
  name: '',
  content: '',
})

export const buildScriptTemplateInput = (template?: ScriptTemplate | null): ScriptTemplateInput => ({
  name: template?.name ?? '',
  content: template?.content ?? '',
})

export const hasScriptTemplateInputChanges = (initial: ScriptTemplateInput, current: ScriptTemplateInput): boolean =>
  initial.name.trim() !== current.name.trim() || initial.content.trim() !== current.content.trim()

export const validateScriptTemplateInput = (
  templates: ScriptTemplate[],
  input: ScriptTemplateInput,
  editingTemplateId: string | null,
): { ok: true; value: ScriptTemplateInput } | { ok: false; errors: ScriptTemplateFormErrors } => {
  const name = input.name.trim()
  const content = input.content.trim()
  const errors: ScriptTemplateFormErrors = {}

  if (!name) {
    errors.name = '请输入模板名称'
  }

  if (!content) {
    errors.content = '请输入模板内容'
  }

  const duplicated = templates.some(
    (template) =>
      template.id !== editingTemplateId && template.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
  )

  if (duplicated) {
    errors.name = '模板名称已存在，请更换后重试'
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      name,
      content,
    },
  }
}
