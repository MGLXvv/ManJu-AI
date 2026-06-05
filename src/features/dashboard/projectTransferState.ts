import type { Project } from '@/types/project'

export interface ImportedProjectPayload {
  name: string
  ratio: Project['ratio']
  style: string
  status?: Project['status']
  currentStep?: Project['currentStep']
  duration?: string
  coverUrl?: string
  favorite?: boolean
}

const normalizeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

const sanitizeImportedProject = (value: unknown): ImportedProjectPayload | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const name = normalizeText(record.name)
  const ratio = record.ratio === '9:16' ? '9:16' : record.ratio === '16:9' ? '16:9' : ''
  const style = normalizeText(record.style)

  if (!name || !ratio || !style) {
    return null
  }

  const sanitized: ImportedProjectPayload = {
    name,
    ratio,
    style,
  }

  if (record.status === 'completed' || record.status === 'in_progress') {
    sanitized.status = record.status
  }

  if (
    record.currentStep === 'script' ||
    record.currentStep === 'settings' ||
    record.currentStep === 'storyboard' ||
    record.currentStep === 'video' ||
    record.currentStep === 'dubbing' ||
    record.currentStep === 'complete'
  ) {
    sanitized.currentStep = record.currentStep
  }

  const duration = normalizeText(record.duration)
  if (duration) {
    sanitized.duration = duration
  }

  const coverUrl = normalizeText(record.coverUrl)
  if (coverUrl) {
    sanitized.coverUrl = coverUrl
  }

  if (typeof record.favorite === 'boolean') {
    sanitized.favorite = record.favorite
  }

  return sanitized
}

export const parseImportedProjects = (raw: string): ImportedProjectPayload[] => {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('PROJECT_IMPORT_INVALID_JSON')
  }

  const normalized = (Array.isArray(parsed) ? parsed : [parsed]).map(sanitizeImportedProject).filter(Boolean) as ImportedProjectPayload[]

  if (!normalized.length) {
    throw new Error('PROJECT_IMPORT_INVALID')
  }

  return normalized
}

export const buildProjectExportFileName = (name: string): string => {
  const sanitized = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${sanitized || 'project'}.json`
}
