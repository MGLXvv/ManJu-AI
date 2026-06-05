import type { SettingAsset } from '@/types/settingAsset'

export interface SettingStoryboardValidationResult {
  ok: boolean
  message: string
}

export const validateSettingBeforeStoryboard = (assets: SettingAsset[]): SettingStoryboardValidationResult => {
  const characterCount = assets.filter((asset) => asset.type === 'character').length
  const sceneCount = assets.filter((asset) => asset.type === 'scene').length

  if (characterCount === 0) {
    return {
      ok: false,
      message: '请至少创建一个角色设定后再进入分镜',
    }
  }

  if (sceneCount === 0) {
    return {
      ok: false,
      message: '请至少创建一个场景设定后再进入分镜',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
