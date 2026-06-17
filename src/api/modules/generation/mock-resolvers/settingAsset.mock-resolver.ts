import { settingApi } from '@/api/setting.api'
import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { API_ERROR_CODES, GENERATION_TASK_STATUSES } from '@/types/api-enums'
import type { SettingAssetGeneratePayload } from '@/services/generation/generationPayload.types'
import type { GenerationTask } from '../generation.types'
import type { MockGenerationTaskSettlement } from './types'

export const resolveSettingAssetMockTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  if (task.type !== 'setting_asset') {
    return null
  }

  const payload = task.payload as Partial<SettingAssetGeneratePayload> | undefined
  const targetAsset = payload?.asset
  const name = String(payload?.name ?? targetAsset?.title ?? '')
  const description = String(payload?.description ?? targetAsset?.roleName ?? '')
  const prompt = String(payload?.prompt ?? targetAsset?.prompt ?? '')

  if (hasAnyMockFailureToken([name, description, prompt], ['#mock-image-fail'])) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.settingImageGenerateFailed,
      result: task.result,
    }
  }

  if (!targetAsset) {
    return {
      status: GENERATION_TASK_STATUSES.failed,
      progress: 100,
      errorMessage: API_ERROR_CODES.settingImageGenerateFailed,
      result: task.result,
    }
  }

  const result = await settingApi.generateAssetImage(targetAsset)
  return {
    status: GENERATION_TASK_STATUSES.success,
    progress: 100,
    result: {
      assetId: targetAsset.id,
      imageUrl: result.imageUrl,
      asset: result.asset,
    },
    errorMessage: undefined,
  }
}
