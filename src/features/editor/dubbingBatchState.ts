import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import { isVisibleDubbingCard } from './dubbingCardVisibilityState'

export const isDubbingLineGenerating = (line: DubbingRoleLineDraft): boolean =>
  line.status === 'pending' || line.status === 'generating'

export const isDubbingLineCompleted = (line: DubbingRoleLineDraft): boolean =>
  line.status === 'success' && Boolean(line.audioUrl)

export const isDubbingCardCompleted = (card: DubbingRoleCardModel): boolean =>
  card.lines.length > 0 && card.lines.every(isDubbingLineCompleted)

export const isDubbingCardGenerating = (card: DubbingRoleCardModel): boolean =>
  card.lines.some(isDubbingLineGenerating)

export const canBatchGenerateDubbingCard = (card: DubbingRoleCardModel): boolean => {
  if (!isVisibleDubbingCard(card)) {
    return false
  }

  if (card.lines.length === 0) {
    return false
  }

  if (isDubbingCardGenerating(card)) {
    return false
  }

  if (isDubbingCardCompleted(card)) {
    return false
  }

  return true
}

export const resolveDubbingBatchGenerateTargets = (
  cards: DubbingRoleCardModel[],
): DubbingRoleCardModel[] => cards.filter(canBatchGenerateDubbingCard)
