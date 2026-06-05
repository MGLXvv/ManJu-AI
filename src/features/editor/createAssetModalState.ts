import type { SettingAsset, SettingAssetType } from '@/types/settingAsset'

export interface CreateAssetFormState {
  type: SettingAssetType
  title: string
  prompt: string
}

export interface CreateAssetFieldErrors {
  type?: true
  title?: true
  prompt?: true
}

export const createEmptyCreateAssetForm = (): CreateAssetFormState => ({
  type: 'character',
  title: '',
  prompt: '',
})

export const isCreateAssetFormDirty = (form: CreateAssetFormState): boolean => {
  return form.type !== 'character' || form.title.trim().length > 0 || form.prompt.trim().length > 0
}

export const getCreateAssetFieldErrors = (form: CreateAssetFormState): CreateAssetFieldErrors => {
  const errors: CreateAssetFieldErrors = {}

  if (!form.type) {
    errors.type = true
  }

  if (!form.title.trim()) {
    errors.title = true
  }

  if (!form.prompt.trim()) {
    errors.prompt = true
  }

  return errors
}
