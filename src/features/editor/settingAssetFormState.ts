import type { SettingAssetType } from '@/types/settingAsset'

export interface SettingAssetFormInput {
  type: SettingAssetType
  title: string
  roleName?: string
  description: string
  prompt: string
  voiceId?: string
  voiceName?: string
}

export interface SettingAssetFieldErrors {
  type?: true
  title?: true
  roleName?: true
  description?: true
  prompt?: true
}

export const createSettingAssetForm = (type: SettingAssetType = 'character'): SettingAssetFormInput => {
  if (type === 'character') {
    return {
      type,
      title: '',
      roleName: '',
      description: '',
      prompt: '',
      voiceId: '',
      voiceName: '',
    }
  }

  return {
    type,
    title: '',
    description: '',
    prompt: '',
  }
}

export const sanitizeSettingAssetCreateInput = (form: SettingAssetFormInput): SettingAssetFormInput => {
  const base = {
    type: form.type,
    title: form.title.trim(),
    description: form.description.trim(),
    prompt: form.prompt.trim(),
  }

  if (form.type === 'character') {
    return {
      ...base,
      roleName: form.roleName?.trim() ?? '',
      voiceId: form.voiceId?.trim() ?? '',
      voiceName: form.voiceName?.trim() ?? '',
    }
  }

  return base
}

export const isSettingAssetFormDirty = (form: SettingAssetFormInput): boolean => {
  const sanitized = sanitizeSettingAssetCreateInput(form)
  return Object.entries(sanitized).some(([key, value]) => key !== 'type' && Boolean(value))
}

export const getSettingAssetFieldErrors = (form: SettingAssetFormInput): SettingAssetFieldErrors => {
  const sanitized = sanitizeSettingAssetCreateInput(form)
  const errors: SettingAssetFieldErrors = {}

  if (!sanitized.type) {
    errors.type = true
  }

  if (!sanitized.title) {
    errors.title = true
  }

  if (!sanitized.description && !sanitized.prompt) {
    errors.description = true
    errors.prompt = true
  }

  return errors
}
