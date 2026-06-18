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

export const buildImportedProjectName = (name: string): string => {
  const trimmed = name.trim()
  return trimmed ? `${trimmed}（导入）` : '未命名项目（导入）'
}

export const normalizeImportedProject = (input: ImportedProjectPayload): ImportedProjectPayload => ({
  ...input,
  name: buildImportedProjectName(input.name),
})
