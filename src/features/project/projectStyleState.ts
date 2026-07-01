import type { SystemStyleItem } from '@/types/system'

export interface ProjectStyleOption {
  id: string
  label: string
  value: string
  description?: string
  previewUrl?: string
  disabled?: boolean
}

export const mapSystemStylesToProjectStyleOptions = (
  styles: SystemStyleItem[],
): ProjectStyleOption[] =>
  styles
    .filter((style) => style.enabled !== false)
    .map((style) => ({
      id: style.id,
      label: style.name,
      value: style.name,
      description: style.prompt,
      previewUrl: style.previewUrl,
    }))