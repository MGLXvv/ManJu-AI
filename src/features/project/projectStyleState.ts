import type { SystemStyleItem } from '@/types/system'

export interface ProjectStyleOption {
  id: string
  label: string
  value: string
  description?: string
  previewUrl?: string
  disabled?: boolean
}

export const DEFAULT_PROJECT_STYLE_OPTION: ProjectStyleOption = {
  id: 'default-style',
  label: '默认风格',
  value: '默认风格',
  description: '系统默认风格',
}

export const mapSystemStylesToProjectStyleOptions = (
  styles: SystemStyleItem[],
): ProjectStyleOption[] => {
  const enabledOptions = styles
    .filter((style) => style.enabled !== false)
    .map((style) => ({
      id: style.id,
      label: style.name,
      value: style.name,
      description: style.prompt,
      previewUrl: style.previewUrl,
    }))

  return enabledOptions.length ? enabledOptions : [DEFAULT_PROJECT_STYLE_OPTION]
}