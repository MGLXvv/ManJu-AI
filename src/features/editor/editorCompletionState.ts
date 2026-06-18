import { validateDubbingBeforeComplete } from '@/features/editor/dubbingPersistState'
import { canEnterStoryboard } from '@/features/editor/scriptGenerationState'
import { validateSettingBeforeStoryboard } from '@/features/editor/settingStoryboardState'
import type { StoryboardMode } from '@/features/editor/storyboardModeState'
import { validateStoryboardBeforeVideo } from '@/features/editor/storyboardPersistState'
import { validateVideoBeforeDubbing } from '@/features/editor/videoPersistState'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { WorkflowStep } from '@/types/project'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

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
}

export type EditorAdvancePayload = {
  generatedScript?: string
  assets?: SettingAsset[]
  shots?: StoryboardShot[]
  cards?: DubbingRoleCardModel[]
  storyboardMode?: StoryboardMode
}

export type EditorAdvanceResult = EditorAdvanceSuccess | EditorAdvanceFailure

export function validateEditorAdvance(key: EditorAdvanceKey, payload: EditorAdvancePayload): EditorAdvanceResult {
  switch (key) {
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
        return { ok: false, message: result.message }
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
        return { ok: false, message: result.message }
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
