import type { EditorDraft } from '@/types/editor'
import { resolveVisibleDubbingCards } from './dubbingCardVisibilityState'

export interface CompleteSummary {
  shotCount: number
  playableVideoCount: number
  generatedAudioCount: number
}

export const buildCompleteSummary = (draft: EditorDraft | null | undefined): CompleteSummary => {
  if (!draft) {
    return {
      shotCount: 0,
      playableVideoCount: 0,
      generatedAudioCount: 0,
    }
  }

  const visibleShots = draft.shots.filter((shot) => !shot.isHidden)
  const visibleCards = resolveVisibleDubbingCards(draft.dubbing.cards)

  return {
    shotCount: visibleShots.length,
    playableVideoCount: visibleShots.filter((shot) => Boolean(shot.videoUrl)).length,
    generatedAudioCount: visibleCards.reduce(
      (count, card) => count + card.lines.filter((line) => Boolean(line.audioUrl)).length,
      0,
    ),
  }
}
