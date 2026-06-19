import { resolveDubbingCards } from '@/features/editor/dubbingDraftState'
import { canEnterStoryboard } from '@/features/editor/scriptGenerationState'
import { validateDubbingBeforeComplete } from '@/features/editor/dubbingPersistState'
import { validateSettingBeforeStoryboard } from '@/features/editor/settingStoryboardState'
import { resolveStoryboardShots, validateStoryboardBeforeVideo } from '@/features/editor/storyboardPersistState'
import { validateVideoBeforeDubbing } from '@/features/editor/videoPersistState'
import type { EditorDraft } from '@/types/editor'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardTagOptions } from '@/types/storyboard'

export const EDITOR_ROUTE_SEQUENCE = [
  'editor-script',
  'editor-settings',
  'editor-storyboard',
  'editor-video',
  'editor-dubbing',
  'editor-complete',
] as const

export type EditorRouteName = (typeof EDITOR_ROUTE_SEQUENCE)[number]

export interface EditorRouteBlockReason {
  routeName: EditorRouteName
  message: string
}

export interface EditorRouteGuardAllowed {
  ok: true
}

export interface EditorRouteGuardBlocked {
  ok: false
  redirectRouteName: EditorRouteName
  message: string
}

export type EditorRouteGuardResult = EditorRouteGuardAllowed | EditorRouteGuardBlocked

export function isEditorStepRouteName(name: unknown): name is EditorRouteName {
  return typeof name === 'string' && EDITOR_ROUTE_SEQUENCE.includes(name as EditorRouteName)
}

const buildRouteGuardTagOptions = (assets: SettingAsset[]): StoryboardTagOptions => ({
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

export function resolveFirstIncompleteEditorRoute(draft: EditorDraft | null): EditorRouteBlockReason | null {
  if (!draft || !canEnterStoryboard(draft.script.generated)) {
    return {
      routeName: 'editor-script',
      message: '请先生成剧本，再进入下一步',
    }
  }

  const settingResult = validateSettingBeforeStoryboard(draft.settingAssets)
  if (!settingResult.ok) {
    return {
      routeName: 'editor-settings',
      message: settingResult.message,
    }
  }

  const resolvedShots = resolveStoryboardShots(
    draft.shots,
    buildRouteGuardTagOptions(draft.settingAssets),
    draft.settingAssets,
  )

  const storyboardResult = validateStoryboardBeforeVideo(resolvedShots, draft.storyboardGenerationMode)
  if (!storyboardResult.ok) {
    return {
      routeName: 'editor-storyboard',
      message: storyboardResult.message,
    }
  }

  const videoResult = validateVideoBeforeDubbing(resolvedShots)
  if (!videoResult.ok) {
    return {
      routeName: 'editor-video',
      message: videoResult.message,
    }
  }

  const dubbingResult = validateDubbingBeforeComplete(resolveDubbingCards(draft))
  if (!dubbingResult.ok) {
    return {
      routeName: 'editor-dubbing',
      message: dubbingResult.message,
    }
  }

  return null
}

export function resolveEditorRouteGuard(
  targetRouteName: EditorRouteName,
  draft: EditorDraft | null,
): EditorRouteGuardResult {
  const firstIncomplete = resolveFirstIncompleteEditorRoute(draft)

  if (!firstIncomplete) {
    return { ok: true }
  }

  const targetIndex = EDITOR_ROUTE_SEQUENCE.indexOf(targetRouteName)
  const allowedIndex = EDITOR_ROUTE_SEQUENCE.indexOf(firstIncomplete.routeName)

  if (targetIndex <= allowedIndex) {
    return { ok: true }
  }

  return {
    ok: false,
    redirectRouteName: firstIncomplete.routeName,
    message: firstIncomplete.message,
  }
}
