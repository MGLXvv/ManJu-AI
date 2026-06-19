import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import { isVisibleDubbingCard } from './dubbingCardVisibilityState'

export interface DubbingBatchAvailability {
  totalCount: number
  visibleCount: number
  targetCards: DubbingRoleCardModel[]
  targetIds: string[]
  hiddenCount: number
  emptyLineCount: number
  generatingCount: number
  completedCount: number
  unavailableCount: number
  canGenerate: boolean
  disabledReason: string
}

export const isDubbingLineGenerating = (line: DubbingRoleLineDraft): boolean =>
  line.status === 'pending' || line.status === 'generating'

export const isDubbingLineCompleted = (line: DubbingRoleLineDraft): boolean =>
  line.status === 'success' && Boolean(line.audioUrl)

export const isDubbingCardCompleted = (card: DubbingRoleCardModel): boolean =>
  card.lines.length > 0 && card.lines.every(isDubbingLineCompleted)

export const isDubbingCardGenerating = (card: DubbingRoleCardModel): boolean =>
  card.lines.some(isDubbingLineGenerating)

export const buildDubbingCardGenerateDisabledReason = (card: DubbingRoleCardModel): string => {
  if (!isVisibleDubbingCard(card)) {
    return '当前角色配音卡片已隐藏，无法生成配音'
  }

  if (card.lines.length === 0) {
    return '当前角色没有台词，无法生成配音'
  }

  if (isDubbingCardGenerating(card)) {
    return '当前角色配音正在生成中，请稍后再试'
  }

  if (isDubbingCardCompleted(card)) {
    return '当前角色配音已生成，无需重复生成'
  }

  return ''
}

export const canBatchGenerateDubbingCard = (card: DubbingRoleCardModel): boolean =>
  !buildDubbingCardGenerateDisabledReason(card)

export const resolveDubbingBatchAvailability = (cards: DubbingRoleCardModel[]): DubbingBatchAvailability => {
  let hiddenCount = 0
  let emptyLineCount = 0
  let generatingCount = 0
  let completedCount = 0

  const targetCards: DubbingRoleCardModel[] = []

  for (const card of cards) {
    if (!isVisibleDubbingCard(card)) {
      hiddenCount += 1
      continue
    }

    if (card.lines.length === 0) {
      emptyLineCount += 1
      continue
    }

    if (isDubbingCardGenerating(card)) {
      generatingCount += 1
      continue
    }

    if (isDubbingCardCompleted(card)) {
      completedCount += 1
      continue
    }

    targetCards.push(card)
  }

  const totalCount = cards.length
  const visibleCount = totalCount - hiddenCount
  const unavailableCount = totalCount - targetCards.length

  let disabledReason = ''

  if (totalCount === 0) {
    disabledReason = '当前没有可配音的角色卡片'
  } else if (visibleCount === 0) {
    disabledReason = '当前角色配音卡片均已隐藏，无法批量配音'
  } else if (targetCards.length === 0 && emptyLineCount === visibleCount) {
    disabledReason = '当前角色配音卡片均没有台词，无法批量配音'
  } else if (targetCards.length === 0 && generatingCount === visibleCount) {
    disabledReason = '当前角色配音正在生成中，请稍后再试'
  } else if (targetCards.length === 0 && completedCount === visibleCount) {
    disabledReason = '当前角色配音均已生成，无需重复生成'
  } else if (targetCards.length === 0) {
    disabledReason = '当前没有可批量生成的配音卡片'
  }

  return {
    totalCount,
    visibleCount,
    targetCards,
    targetIds: targetCards.map((card) => card.id),
    hiddenCount,
    emptyLineCount,
    generatingCount,
    completedCount,
    unavailableCount,
    canGenerate: targetCards.length > 0,
    disabledReason,
  }
}

export const resolveDubbingBatchGenerateTargets = (
  cards: DubbingRoleCardModel[],
): DubbingRoleCardModel[] => resolveDubbingBatchAvailability(cards).targetCards
