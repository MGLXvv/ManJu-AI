import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { SettingAssetGeneratePayload } from './generationPayload.types'
import { assertSettingAssetResult } from './generationResultGuards'
import type { SettingAssetImageResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'

export interface GenerateSettingAssetImageInput {
  projectId: string
  asset: SettingAsset
}

export const settingAssetGenerationService = {
  async generateAssetImage(input: GenerateSettingAssetImageInput): Promise<SettingAssetImageResult> {
    const payload: SettingAssetGeneratePayload = {
      assetId: input.asset.id,
      type: input.asset.type,
      name: input.asset.title,
      description: input.asset.roleName ?? '',
      prompt: input.asset.prompt,
      asset: input.asset,
    }

    const task = await createAndWaitGenerationTask(
      {
        projectId: input.projectId,
        type: GENERATION_TASK_TYPES.settingAsset,
        payload: payload as Record<string, unknown>,
      },
      {
        interval: 100,
      },
    )

    return assertSettingAssetResult(task.result as Partial<SettingAssetImageResult> | undefined)
  },
}
