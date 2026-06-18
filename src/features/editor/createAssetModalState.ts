import {
  createSettingAssetForm,
  getSettingAssetFieldErrors,
  isSettingAssetFormDirty,
  type SettingAssetFieldErrors as CreateAssetFieldErrors,
  type SettingAssetFormInput as CreateAssetFormState,
} from './settingAssetFormState'

export type { CreateAssetFieldErrors, CreateAssetFormState }

export const createEmptyCreateAssetForm = (): CreateAssetFormState => createSettingAssetForm('character')

export { getSettingAssetFieldErrors as getCreateAssetFieldErrors, isSettingAssetFormDirty as isCreateAssetFormDirty }
