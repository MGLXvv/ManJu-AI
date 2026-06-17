import { buildDubbingExportFileName } from '@/features/editor/editorArtifactMapper'
import type { DubbingRoleCardModel } from '@/types/dubbing'

export interface DubbingCompleteValidationResult {
  ok: boolean
  message: string
}

export { buildDubbingExportFileName }

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
