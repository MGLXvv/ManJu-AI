import { isLocalAssetId } from '@/api/modules/editor/asset.mapper'
import { apiMode } from '@/api/shared/apiMode'
import { assetImageTaskService } from '@/services/editor/assetImageTask.service'
import { assetWorkflowService } from '@/services/editor/assetWorkflow.service'
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
    if (apiMode === 'http') {
      if (isLocalAssetId(input.asset.id)) {
        throw new Error('SETTING_ASSET_IMAGE_REQUIRES_PERSISTED_ASSET')
      }

      const task = await assetImageTaskService.createAssetImageTask(input.asset.id, input.asset.prompt)
      const workspace = await assetWorkflowService.loadAssetWorkspace(input.projectId)
      const refreshedAsset = workspace?.find((asset) => asset.id === input.asset.id)
      const imageUrl = refreshedAsset?.imageUrls[0] ?? task?.resultUrl ?? ''

      return assertSettingAssetResult({
        assetId: input.asset.id,
        imageUrl,
        asset: refreshedAsset ?? {
          ...input.asset,
          imageUrls: imageUrl ? [imageUrl] : [],
          status: imageUrl ? 'ready' : 'failed',
        },
      })
    }

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
