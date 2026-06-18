import type { EditorDraft } from '@/types/editor'
import type { WorkflowStep } from '@/types/project'
import { buildProjectArtifactEnvelope, buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import type { Shot } from '@/types/editor'

export type EditorExportScope = WorkflowStep

export const resolveExportScopeSteps = (scope: EditorExportScope): WorkflowStep[] => {
  switch (scope) {
    case 'script':
      return ['script']
    case 'settings':
      return ['script', 'settings']
    case 'storyboard':
      return ['script', 'settings', 'storyboard']
    case 'video':
      return ['script', 'settings', 'storyboard', 'video']
    case 'dubbing':
    case 'complete':
      return ['script', 'settings', 'storyboard', 'video', 'dubbing']
  }
}

export interface ScopedEditorExportPayload {
  currentStep: EditorExportScope
  steps: WorkflowStep[]
  draft: Partial<EditorDraft>
}

const cloneScopedShots = (shots: Shot[], scope: EditorExportScope): Shot[] =>
  shots.map((shot) => {
    const nextShot: Shot = {
      id: shot.id,
      index: shot.index,
      title: shot.title,
      description: shot.description,
      characterIds: [...shot.characterIds],
      sceneIds: [...shot.sceneIds],
      propIds: [...shot.propIds],
      imageUrl: shot.imageUrl,
      status: shot.status,
      style: shot.style,
      ratio: shot.ratio,
      isHidden: shot.isHidden,
      isLocked: shot.isLocked,
      isFavorite: shot.isFavorite,
      referenceImages: shot.referenceImages?.map((item) => ({ ...item })),
      createdAt: shot.createdAt,
    }

    if (scope === 'video' || scope === 'dubbing' || scope === 'complete') {
      nextShot.videoUrl = shot.videoUrl
      nextShot.videoPrompt = shot.videoPrompt
      nextShot.dialogue = shot.dialogue
      nextShot.durationSeconds = shot.durationSeconds
      nextShot.voiceAssignments = shot.voiceAssignments?.map((item) => ({ ...item })) ?? []
    }

    return nextShot
  })

export const buildScopedEditorExportPayload = (
  draft: EditorDraft,
  scope: EditorExportScope,
): ScopedEditorExportPayload => {
  const steps = resolveExportScopeSteps(scope)
  const scopedDraft: Partial<EditorDraft> = {
    projectId: draft.projectId,
    script: draft.script,
  }

  if (steps.includes('settings')) {
    scopedDraft.characters = draft.characters
    scopedDraft.scenes = draft.scenes
    scopedDraft.props = draft.props
    scopedDraft.settingAssets = draft.settingAssets
  }

  if (steps.includes('storyboard')) {
    scopedDraft.storyboardGenerationMode = draft.storyboardGenerationMode
    scopedDraft.shots = cloneScopedShots(draft.shots, scope)
  }

  if (steps.includes('dubbing')) {
    scopedDraft.dubbing = draft.dubbing
  }

  return {
    currentStep: scope,
    steps,
    draft: scopedDraft,
  }
}

export const buildScopedProjectArtifact = (projectId: string, draft: EditorDraft, scope: EditorExportScope) =>
  buildProjectArtifactEnvelope({
    artifact: 'project',
    projectId: projectId || draft.projectId || 'project',
    payload: buildScopedEditorExportPayload(draft, scope),
  })

export const buildScopedProjectExportFileName = (projectId: string): string =>
  buildProjectArtifactFileName(projectId || 'project', 'project')
