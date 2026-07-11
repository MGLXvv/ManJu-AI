import { isLocalAssetId } from '@/api/modules/editor/asset.mapper'
import { isMockMode } from '@/api/shared/apiMode'
import { assetImageTaskService } from '@/services/editor/assetImageTask.service'
import { resolveImmediateAiTaskResultUrl } from '@/services/editor/aiTaskResultState'
import { assetWorkflowService } from '@/services/editor/assetWorkflow.service'
import { GENERATION_TASK_TYPES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { SettingAssetGeneratePayload } from './generationPayload.types'
import { assertSettingAssetResult } from './generationResultGuards'
import type { SettingAssetImageResult, SettingAssetImageTaskResult } from './generationResult.types'
import { createAndWaitGenerationTask } from './generationTaskRunner'
import { generationWorkspaceRefreshService } from './generationWorkspaceRefresh.service'

export interface GenerateSettingAssetImageInput {
  projectId: string
  asset: SettingAsset
}

const buildSettingAssetGeneratePayload = (asset: SettingAsset): SettingAssetGeneratePayload => ({
  assetId: asset.id,
  type: asset.type,
  name: asset.title,
  description: asset.roleName ?? '',
  prompt: asset.prompt,
  asset,
})

export const settingAssetGenerationService = {
  async generateAssetImage(input: GenerateSettingAssetImageInput): Promise<SettingAssetImageResult> {
    if (isMockMode) {
      const payload = buildSettingAssetGeneratePayload(input.asset)
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

      const taskResult = assertSettingAssetResult(
        task.result as Partial<SettingAssetImageTaskResult> | undefined,
      )
      return generationWorkspaceRefreshService.resolveSettingAsset(input.projectId, input.asset, taskResult)
    }

    if (isLocalAssetId(input.asset.id)) {
      throw new Error('SETTING_ASSET_IMAGE_REQUIRES_PERSISTED_ASSET')
    }

    const task = await assetImageTaskService.createAssetImageTask(input.asset.id, input.asset.prompt)
    const workspace = await assetWorkflowService.loadAssetWorkspace(input.projectId)
    const refreshedAsset = workspace?.find((asset) => asset.id === input.asset.id)
    const imageUrl = resolveImmediateAiTaskResultUrl({
      task,
      workspaceResultUrl: refreshedAsset?.imageUrls[0],
    })
    const taskResult = assertSettingAssetResult({
      assetId: input.asset.id,
      imageUrl,
    })
    return generationWorkspaceRefreshService.resolveSettingAsset(input.projectId, input.asset, taskResult)
  },
}
