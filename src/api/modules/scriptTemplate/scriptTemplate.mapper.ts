import type { ScriptTemplate } from './scriptTemplate.types'

export interface BackendScriptTemplateDTO {
  id?: string | number | null
  name?: string | null
  content?: string | null
  updatedAt?: string | null
  updateTime?: string | null
  createTime?: string | null
}

export const mapBackendScriptTemplate = (record: BackendScriptTemplateDTO): ScriptTemplate => ({
  id: String(record.id ?? ''),
  name: record.name ?? '',
  content: record.content ?? '',
  updatedAt: record.updatedAt ?? record.updateTime ?? record.createTime ?? '',
})
