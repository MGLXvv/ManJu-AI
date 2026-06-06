import { buildProjectArtifactFileName } from '@/features/shared/projectArtifactState'
import type { DubbingRoleCardModel } from '@/types/dubbing'

export interface DubbingCompleteValidationResult {
  ok: boolean
  message: string
}

export const buildDubbingExportFileName = (projectId: string): string => {
  return buildProjectArtifactFileName(projectId || 'dubbing', 'dubbing')
}

export const validateDubbingBeforeComplete = (cards: DubbingRoleCardModel[]): DubbingCompleteValidationResult => {
  const hasGeneratedAudio = cards.some((card) => !card.hidden && card.lines.some((line) => Boolean(line.audioUrl)))

  if (!hasGeneratedAudio) {
    return {
      ok: false,
      message: '请至少生成一条配音后再进入完成页',
    }
  }

  return {
    ok: true,
    message: '',
  }
}
