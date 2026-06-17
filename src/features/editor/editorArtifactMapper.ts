import { buildProjectArtifactEnvelope, buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import type { DubbingDraft } from '@/types/dubbing'
import type { Shot } from '@/types/editor'
import type { StoryboardShot } from '@/types/storyboard'
import { buildStoryboardDraftShots } from './editorDraftMapper'

export interface ExportedStoryboardPayload {
  exportedAt: string
  shots: Shot[]
}

export interface ExportedVideoPayload {
  exportedAt: string
  shots: Shot[]
}

export interface ExportedDubbingPayload {
  dubbing: DubbingDraft
}

export const buildStoryboardExportPayload = (shots: StoryboardShot[]): ExportedStoryboardPayload => ({
  exportedAt: new Date().toISOString(),
  shots: buildStoryboardDraftShots(shots),
})

export const buildVideoExportPayload = (shots: Shot[]): ExportedVideoPayload => ({
  exportedAt: new Date().toISOString(),
  shots: shots.map((shot) => ({
    ...shot,
    characterIds: [...shot.characterIds],
    sceneIds: [...shot.sceneIds],
    propIds: [...shot.propIds],
    voiceAssignments: shot.voiceAssignments?.map((item) => ({ ...item })) ?? [],
    referenceImages: shot.referenceImages?.map((item) => ({ ...item })) ?? [],
  })),
})

export const buildDubbingExportPayload = (dubbing: DubbingDraft): ExportedDubbingPayload => ({
  dubbing: {
    ...dubbing,
    cards: dubbing.cards.map((card) => ({
      ...card,
      lines: card.lines.map((line) => ({ ...line })),
    })),
  },
})

export const buildStoryboardArtifact = (projectId: string, shots: StoryboardShot[]) =>
  buildProjectArtifactEnvelope({
    artifact: 'storyboard',
    projectId: projectId || 'storyboard',
    payload: buildStoryboardExportPayload(shots),
  })

export const buildVideoArtifact = (projectId: string, shots: Shot[]) =>
  buildProjectArtifactEnvelope({
    artifact: 'video',
    projectId: projectId || 'video',
    payload: buildVideoExportPayload(shots),
  })

export const buildDubbingArtifact = (projectId: string, dubbing: DubbingDraft) =>
  buildProjectArtifactEnvelope({
    artifact: 'dubbing',
    projectId: projectId || 'dubbing',
    payload: buildDubbingExportPayload(dubbing),
  })

export const buildStoryboardExportFileName = (projectId: string): string =>
  buildProjectArtifactFileName(projectId || 'storyboard', 'storyboard')

export const buildVideoExportFileName = (projectId: string): string =>
  buildProjectArtifactFileName(projectId || 'video', 'video')

export const buildDubbingExportFileName = (projectId: string): string =>
  buildProjectArtifactFileName(projectId || 'dubbing', 'dubbing')
