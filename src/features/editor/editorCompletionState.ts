import { resolveDubbingCards } from '@/features/editor/dubbingDraftState'
import { validateDubbingBeforeComplete } from '@/features/editor/dubbingPersistState'
import { canEnterStoryboard } from '@/features/editor/scriptGenerationState'
import { validateSettingBeforeStoryboard } from '@/features/editor/settingStoryboardState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import { resolveStoryboardShots, validateStoryboardBeforeVideo } from '@/features/editor/storyboardPersistState'
import { validateVideoBeforeDubbing } from '@/features/editor/videoPersistState'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { EditorDraft } from '@/types/editor'
import type { WorkflowStep } from '@/types/project'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

export type EditorAdvanceKey =
  | 'scriptToSettings'
  | 'settingsToStoryboard'
  | 'storyboardToVideo'
  | 'videoToDubbing'
  | 'dubbingToComplete'

export interface EditorAdvanceSuccess {
  ok: true
  nextStep: WorkflowStep
  routeName:
    | 'editor-settings'
    | 'editor-storyboard'
    | 'editor-video'
    | 'editor-dubbing'
    | 'editor-complete'
  successMessage: string
}

export interface EditorAdvanceFailure {
  ok: false
  message: string
  shotId?: string
}

export type EditorAdvancePayload = {
  generatedScript?: string
  assets?: SettingAsset[]
  shots?: StoryboardShot[]
  cards?: DubbingRoleCardModel[]
  storyboardMode?: StoryboardMode
}

export type EditorAdvanceResult = EditorAdvanceSuccess | EditorAdvanceFailure

type LegacyEditorAdvanceStep = 'script' | 'settings' | 'storyboard' | 'video' | 'dubbing' | 'complete'

export interface LegacyEditorAdvancePayload {
  from: LegacyEditorAdvanceStep
  to: LegacyEditorAdvanceStep
  draft: EditorDraft
}

export interface LegacyEditorAdvanceResult {
  canAdvance: boolean
  reason?: string
}

const buildLegacyResult = (result: EditorAdvanceResult): LegacyEditorAdvanceResult => {
  if (result.ok) {
    return { canAdvance: true }
  }

  return {
    canAdvance: false,
    reason: result.message,
  }
}

const buildLegacyTagOptions = (assets: SettingAsset[]): StoryboardTagOptions => ({
  characters: assets
    .filter((asset) => asset.type === 'character')
    .map((asset) => ({ id: asset.id, name: asset.title, type: asset.type })),
  scenes: assets
    .filter((asset) => asset.type === 'scene')
    .map((asset) => ({ id: asset.id, name: asset.title, type: asset.type })),
  props: assets
    .filter((asset) => asset.type === 'prop')
    .map((asset) => ({ id: asset.id, name: asset.title, type: asset.type })),
})

const resolveLegacyAdvanceShots = (draft: EditorDraft): StoryboardShot[] =>
  resolveStoryboardShots(draft.shots, buildLegacyTagOptions(draft.settingAssets), draft.settingAssets)

const validateLegacyEditorAdvance = (input: LegacyEditorAdvancePayload): LegacyEditorAdvanceResult => {
  if (input.from === 'dubbing' && input.to === 'complete') {
    return buildLegacyResult(validateEditorAdvance('dubbingToComplete', { cards: resolveDubbingCards(input.draft) }))
  }

  if (input.from === 'script' && input.to === 'settings') {
    return buildLegacyResult(
      validateEditorAdvance('scriptToSettings', { generatedScript: input.draft.script.generated || input.draft.script.content }),
    )
  }

  if (input.from === 'settings' && input.to === 'storyboard') {
    return buildLegacyResult(validateEditorAdvance('settingsToStoryboard', { assets: input.draft.settingAssets }))
  }

  if (input.from === 'storyboard' && input.to === 'video') {
    return buildLegacyResult(
      validateEditorAdvance('storyboardToVideo', {
        shots: resolveLegacyAdvanceShots(input.draft),
        storyboardMode: input.draft.storyboardGenerationMode,
      }),
    )
  }

  if (input.from === 'video' && input.to === 'dubbing') {
    return buildLegacyResult(
      validateEditorAdvance('videoToDubbing', {
        shots: resolveLegacyAdvanceShots(input.draft),
      }),
    )
  }

  return {
    canAdvance: true,
  }
}

export function validateEditorAdvance(key: EditorAdvanceKey, payload: EditorAdvancePayload): EditorAdvanceResult
export function validateEditorAdvance(input: LegacyEditorAdvancePayload): LegacyEditorAdvanceResult
export function validateEditorAdvance(
  keyOrInput: EditorAdvanceKey | LegacyEditorAdvancePayload,
  payload: EditorAdvancePayload = {},
): EditorAdvanceResult | LegacyEditorAdvanceResult {
  if (typeof keyOrInput !== 'string') {
    return validateLegacyEditorAdvance(keyOrInput)
  }

  switch (keyOrInput) {
    case 'scriptToSettings': {
      if (!canEnterStoryboard(payload.generatedScript ?? '')) {
        return { ok: false, message: '请先生成剧本，再进入下一步' }
      }
      return {
        ok: true,
        nextStep: 'settings',
        routeName: 'editor-settings',
        successMessage: '文案已保存，正在进入设定页',
      }
    }
    case 'settingsToStoryboard': {
      const result = validateSettingBeforeStoryboard(payload.assets ?? [])
      if (!result.ok) {
        return { ok: false, message: result.message }
      }
      return {
        ok: true,
        nextStep: 'storyboard',
        routeName: 'editor-storyboard',
        successMessage: '设定已保存，正在进入分镜生成',
      }
    }
    case 'storyboardToVideo': {
      const result = validateStoryboardBeforeVideo(payload.shots ?? [], payload.storyboardMode ?? null)
      if (!result.ok) {
        return { ok: false, message: result.message, shotId: result.shotId }
      }
      return {
        ok: true,
        nextStep: 'video',
        routeName: 'editor-video',
        successMessage: '分镜已保存，正在进入视频生成',
      }
    }
    case 'videoToDubbing': {
      const result = validateVideoBeforeDubbing(payload.shots ?? [])
      if (!result.ok) {
        return { ok: false, message: result.message, shotId: result.shotId }
      }
      return {
        ok: true,
        nextStep: 'dubbing',
        routeName: 'editor-dubbing',
        successMessage: '视频已保存，正在进入配音',
      }
    }
    case 'dubbingToComplete': {
      const result = validateDubbingBeforeComplete(payload.cards ?? [])
      if (!result.ok) {
        return { ok: false, message: result.message }
      }
      return {
        ok: true,
        nextStep: 'complete',
        routeName: 'editor-complete',
        successMessage: '配音已保存，正在进入完成页',
      }
    }
  }
}