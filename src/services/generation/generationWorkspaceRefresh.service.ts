import { isMockMode } from '@/api/shared/apiMode'
import { assetWorkflowService } from '@/services/editor/assetWorkflow.service'
import { storyboardWorkflowService } from '@/services/editor/storyboardWorkflow.service'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'
import type {
  DubbingGenerateTaskResult,
  SettingAssetImageResult,
  SettingAssetImageTaskResult,
  StoryboardImageResult,
  StoryboardImageTaskResult,
  StoryboardUpscaleResult,
  StoryboardUpscaleTaskResult,
  VideoGenerateResult,
  VideoGenerateTaskResult,
} from './generationResult.types'

const loadStoryboardShot = async (projectId: string, shotId: string) => {
  if (isMockMode) {
    return undefined
  }

  try {
    const patch = await storyboardWorkflowService.loadStoryboardWorkspace(projectId)
    return patch?.shots.find((shot) => shot.id === shotId)
  } catch {
    return undefined
  }
}

const mergeWorkspaceShot = (
  current: StoryboardShot,
  workspaceShot: Awaited<ReturnType<typeof loadStoryboardShot>>,
): StoryboardShot | undefined => {
  if (!workspaceShot) {
    return undefined
  }

  return {
    ...current,
    id: workspaceShot.id,
    index: workspaceShot.index,
    title: workspaceShot.title,
    imageUrl: workspaceShot.imageUrl || current.imageUrl,
    videoUrl: workspaceShot.videoUrl || current.videoUrl,
    durationSeconds: workspaceShot.durationSeconds ?? current.durationSeconds,
    createdAt: workspaceShot.createdAt || current.createdAt,
  }
}

const prependGeneratedMediaSlot = (ids: string[] | undefined, max: number): string[] | undefined =>
  ids?.some(Boolean) ? ['', ...ids].slice(0, max) : undefined

const appendGeneratedMediaSlot = (ids: string[] | undefined, max: number): string[] | undefined =>
  ids?.some(Boolean) ? [...ids, ''].slice(-max) : undefined

export const generationWorkspaceRefreshService = {
  async resolveStoryboardImage(
    projectId: string,
    current: StoryboardShot,
    result: StoryboardImageTaskResult,
  ): Promise<StoryboardImageResult> {
    const workspaceShot = mergeWorkspaceShot(current, await loadStoryboardShot(projectId, result.shotId))
    const shot = workspaceShot ?? result.shot ?? current
    return {
      ...result,
      shot: {
        ...shot,
        imageUrl: result.imageUrl || shot.imageUrl,
        imageMediaId: undefined,
        status: result.imageUrl ? 'success' : 'failed',
      },
    }
  },

  async resolveStoryboardUpscale(
    projectId: string,
    current: StoryboardShot,
    result: StoryboardUpscaleTaskResult,
  ): Promise<StoryboardUpscaleResult> {
    const workspaceShot = mergeWorkspaceShot(current, await loadStoryboardShot(projectId, result.shotId))
    const shot = workspaceShot ?? result.shot ?? current
    return {
      ...result,
      shot: {
        ...shot,
        imageUrl: result.imageUrl || shot.imageUrl,
        imageMediaId: undefined,
        status: result.imageUrl ? 'success' : 'failed',
      },
    }
  },

  async resolveSettingAsset(
    projectId: string,
    current: SettingAsset,
    result: SettingAssetImageTaskResult,
  ): Promise<SettingAssetImageResult> {
    let workspaceAsset: SettingAsset | undefined
    if (!isMockMode) {
      try {
        const assets = await assetWorkflowService.loadAssetWorkspace(projectId)
        workspaceAsset = assets?.find((asset) => asset.id === result.assetId)
      } catch {
        workspaceAsset = undefined
      }
    }

    const asset = workspaceAsset ?? result.asset ?? current
    const imageUrls = result.imageUrl
      ? [result.imageUrl, ...asset.imageUrls.filter((url) => url !== result.imageUrl)].slice(0, 6)
      : asset.imageUrls
    const imageMediaIds = result.imageUrl
      ? prependGeneratedMediaSlot(current.imageMediaIds, 6)
      : current.imageMediaIds
    const candidateMediaIds = result.imageUrl && asset.candidateImages?.includes(result.imageUrl)
      ? appendGeneratedMediaSlot(current.candidateMediaIds, 12)
      : asset.candidateMediaIds

    return {
      ...result,
      asset: {
        ...asset,
        imageUrls,
        imageMediaIds,
        candidateMediaIds,
        status: result.imageUrl ? 'ready' : 'failed',
      },
    }
  },

  async resolveVideo(
    projectId: string,
    current: StoryboardShot,
    result: VideoGenerateTaskResult,
  ): Promise<VideoGenerateResult> {
    const workspaceShot = mergeWorkspaceShot(current, await loadStoryboardShot(projectId, result.shotId))
    const shot = workspaceShot ?? result.shot ?? current
    return {
      ...result,
      shot: {
        ...shot,
        videoUrl: result.videoUrl || shot.videoUrl,
        videoMediaId: undefined,
        status: result.videoUrl ? 'success' : 'failed',
      },
    }
  },

  resolveDubbing(card: DubbingRoleCardModel, result: DubbingGenerateTaskResult): DubbingRoleLineDraft[] {
    if (result.lines) {
      return result.lines.map((line) => ({ ...line }))
    }

    const targetIds = new Set(result.lineIds)
    return card.lines.map((line) => {
      if (!targetIds.has(line.id)) {
        return { ...line }
      }
      const audioUrl = result.audioByLineId?.[line.id] ?? line.audioUrl
      return {
        ...line,
        audioUrl,
        status: audioUrl ? 'success' : 'failed',
      }
    })
  },
}
